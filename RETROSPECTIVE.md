# 회고

## 프로젝트 개요

머니로그(개인 가계부 서비스)를 Spring Boot(백엔드) + Next.js(프론트엔드)로 구현했다. 인증(로컬 로그인 + Google OAuth2), 카테고리 CRUD, 거래내역 CRUD·조회·필터·페이징, 월별 통계, 대시보드/거래내역/통계/카테고리 화면까지 구현했다.

개발 과정에서 "일단 되는 것처럼 보이는 코드"와 "실제로 되는 코드"의 차이를 계속 확인하게 됐다. 컴파일이 되고 화면에 그려진다고 해서 로직이 맞는 건 아니었고, 실제로 API를 호출해보거나 테스트를 붙여봐야만 드러나는 버그가 많았다.

---

## 배운 점

### 1. JWT / 인증 흐름

- **Access token의 subject와 서버 코드가 조회에 쓰는 값은 반드시 일치해야 한다.** 토큰 발급 로직과 인가된 사용자를 조회하는 로직이 분리되어 있으면, 둘 중 하나만 고쳐도 나머지가 깨진다는 걸 직접 겪었다.
- **Refresh token은 "발급할 때 반환하는 값"과 "DB에 저장하는 값"이 반드시 같은 원문에서 나와야 한다.** 재발급(reissue) 흐름은 저장값과 반환값이 어긋나면 눈에 안 띄게 조용히 항상 실패한다 — 로그인은 되는데 자동 로그인 유지만 안 되는 식으로 나타나서 원인 파악이 오래 걸렸다.
- **암호학적으로 안전한 난수와 일반 난수는 반드시 구분해서 써야 한다.** `SecureRandom` 필드를 선언해두고 실제로는 지역 변수로 `new Random()`을 새로 만들어 쓰고 있었던 걸 나중에 발견했다 — 선언만으로는 안전하지 않다는 걸 배웠다.
- **예외 타입과 HTTP 상태 코드 매핑은 처음부터 설계해야 한다.** `IllegalArgumentException`, `BadCredentialsException` 등을 상황별로 대충 쓰다 보니 "잘못된 비밀번호"가 401이 아니라 500으로 나가는 문제가 반복적으로 생겼다. 커스텀 예외(`UserNotFoundException`, `CategoryNotFoundException`, `AuthenticationFailedException` 등)를 만들고 `GlobalExceptionHandler`에서 한곳에 모아 상태 코드를 매핑하니 훨씬 예측 가능해졌다.

### 2. JPA / 트랜잭션

- **지연 로딩(LAZY) 엔티티는 트랜잭션이 끝나기 전에 필요한 필드까지 초기화해둬야 한다.** 서비스 메서드가 반환한 엔티티를 트랜잭션 밖(다른 컴포넌트)에서 다시 접근하면 `LazyInitializationException`이 난다는 걸 Google OAuth 로그인에서 실제로 겪었다. `join fetch` 쿼리로 필요한 연관관계를 미리 로딩해서 해결했다.
- **영속(managed) 엔티티는 필드만 바꾸면 dirty checking으로 자동 반영되지만, 새로 만든(transient) 엔티티는 최초 1번은 반드시 `save()`를 호출해야 한다.** 이 구분을 명확히 하지 않아서 회원가입 시 `save()` 누락 버그가 있었다.
- **엔티티의 "업데이트" 메서드를 만들 때, 새 객체를 만들어서 반환하지 않고 버리면 아무 일도 안 일어난다.** `Category.updateCategory()`가 새 `Category.builder()...build()`를 만들고 그 결과를 아무 데도 안 쓰는 no-op 버그였다 — 컴파일도 되고 200 응답도 오지만 DB는 그대로였다.

### 3. Bean Validation

- **애노테이션이 어떤 타입에 적용 가능한지 반드시 확인해야 한다.** `@NotBlank`는 `CharSequence`에만 적용 가능한데 `Long` 필드에 붙였더니 컴파일은 통과하고 실제 검증 시점에 `UnexpectedTypeException`으로 500이 났다.
- **`@Positive`/`@Min` 같은 값 제약은 `null`을 통과시킨다.** null을 막으려면 `@NotNull`을 반드시 같이 붙여야 한다는 걸 몰라서 한 번 놓쳤다.

### 4. 조회 / 페이징 / 필터

- **페이지네이션이 걸린 API에 클라이언트 사이드 필터링을 얹으면 `totalElements`/`totalPages`와 실제로 보이는 개수가 어긋난다.** 카테고리 필터를 프론트에서 응답 받은 뒤 다시 걸러내려다 이 문제를 겪고, 백엔드에 실제 `categoryId`를 넘겨서 서버가 필터링하도록 바꿨다.
- **날짜/연도 필터에서 "연도별", "월별", "연도-월별"을 모두 지원하려면 파라미터를 `year`/`month` 두 개로 분리하고 각각 optional로 둬야 한다.** 문자열 `yearMonth` 하나로는 "특정 월(연도 무관)" 같은 조합을 표현할 수 없었다.

### 5. API 설계

- **DTO에 프론트가 실제로 필요한 값(특히 `id`)을 빼먹으면 나중에 크게 돌아온다.** 목록 조회 응답에 `id`가 없어서 "이 항목을 수정/삭제하라"는 요청 자체를 만들 수 없는 상태로 한참 진행했었다. 응답 DTO를 설계할 때 "이 데이터로 다음에 뭘 할 수 있어야 하는가"를 먼저 생각해야 한다는 걸 배웠다.
- **비즈니스 규칙을 데이터 모델에 너무 강하게 못박으면 나중에 유연성이 없어진다.** 카테고리에 수입/지출 타입을 고정해뒀더니, "투자"처럼 수익도 손실도 될 수 있는 카테고리를 표현할 방법이 없었다. 거래의 유형(수입/지출)은 카테고리와 별개로 사용자가 직접 선택하도록 분리해서 해결했다.
- **부호가 있는 값(잔액처럼 마이너스가 될 수 있는 값)은 "전월 대비 퍼센트" 같은 지표로 표현하면 오해를 부른다.** 0을 기준으로 부호가 바뀌는 값은 퍼센트 계산 자체가 직관과 어긋날 수 있어서, 절대 금액 증감으로 바꿔 표시했다.

### 6. 프론트엔드 (Next.js / React)

- **App Router에서 인증 상태는 Context + 클라이언트 사이드 초기화로 관리하고, httpOnly 쿠키 기반 세션은 "새로고침 시 조용히 재발급을 시도"하는 패턴으로 복구한다**는 걸 처음 구현해봤다.
- **최신 프레임워크 버전(Next.js 16, Tailwind v4)은 학습 당시 알던 API와 다를 수 있다.** 예를 들어 Tailwind v4는 그라디언트 유틸리티 클래스 이름이 바뀌었다 — 확신이 없으면 인라인 스타일 등 버전에 안전한 방법을 쓰는 게 나을 때도 있다는 걸 배웠다.
- **`useEffect` 안에서의 `setState`가 항상 안티패턴은 아니다.** "외부 시스템(백엔드 API, URL 파라미터)에서 값을 읽어와 React 상태와 동기화"하는 것은 정확히 `useEffect`가 존재하는 이유다. 린터가 일괄적으로 경고하더라도 왜 정당한지 이해하고 판단하는 게 중요했다.

---

## 어려웠던 점 (실제 겪은 버그 정리)

프로젝트를 진행하며 실제로 발견하고 고친 문제들이다. 겉보기엔 다 되는 것처럼 보였는데 실제로 호출해보거나 테스트를 붙여보고서야 드러난 것들이 많았다.

| 영역 | 증상 | 원인 | 해결 |
|---|---|---|---|
| JWT | 로그인은 되는데 이후 모든 보호된 API가 실패 | JWT의 subject를 user id로 발급하는데, 컨트롤러들은 `authentication.getName()`을 이메일로 간주해 조회 | subject를 이메일로 통일 |
| Refresh Token | 로그인 직후 재발급(reissue)을 호출하면 항상 401 | 쿠키로 내려주는 원문 토큰과 DB에 저장하는 값이 서로 다른 난수였음 (해시도 안 함) | 하나의 원문 토큰만 생성해 해시로 저장, 원문을 반환 |
| Refresh Token | (잠재적 보안 이슈) 토큰이 예측 가능할 수 있음 | `SecureRandom` 필드를 선언해두고 실제 생성 로직은 지역 `Random()` 사용 | 클래스 필드의 `SecureRandom` 사용하도록 수정 |
| 인증 예외 처리 | 잘못된 비밀번호/무효 토큰이 401이 아니라 500 | `IllegalArgumentException`/`IllegalStateException`이 `GlobalExceptionHandler`에 매핑 안 됨 | `AuthenticationFailedException` 도입 + 401 매핑 |
| 회원가입 | 가입 성공 응답은 오는데 실제 로그인이 안 됨 | `UserService.createUser()`가 `userRepository.save()`를 호출하지 않음 | `save()` 추가 |
| Google OAuth | 로그인 콜백에서 500 에러 (겉보기엔 리다이렉트가 안 되고 8080에 머무름) | 지연 로딩된 `User` 프록시를 트랜잭션 밖에서 초기화하려다 `LazyInitializationException` | `join fetch` 쿼리로 연관관계 즉시 로딩 |
| Google OAuth | 신규 가입 시 username이 `google_105431...` 같은 형태 | Google `sub`(긴 숫자) 뒷부분을 그대로 잘라 사용 | Google 프로필 `name`을 우선 사용, 중복 시 안전하게 대체 |
| 카테고리 수정 | 수정 API가 200을 반환하지만 DB는 그대로 | `updateCategory()`가 새 객체를 만들고 버리기만 함(no-op) | 실제 필드(`this.x = x`) 대입으로 수정 |
| 카테고리 삭제 | 삭제 API가 204를 반환하지만 실제로는 안 지워짐 | 같은 유형의 no-op 버그 | `repository.delete()` 호출 추가 |
| 입력 검증 | 거래 등록 시 검증이 걸리자마자 500 | `@NotBlank`를 `Long` 타입에 적용(타입 불일치) | `@NotNull` + `@Positive` 조합으로 교체 |
| 거래 등록/수정 | 날짜를 지정해도 항상 "지금 시각"으로 저장됨 | 요청의 `date` 필드를 아예 사용하지 않고 `LocalDateTime.now()` 기본값만 사용 | 날짜 파싱 후 명시적으로 저장, 형식 오류는 400 |
| 조회 API | 목록에 페이징/필터가 전혀 없음 | 처음부터 미구현 | `year`/`month`/`type`/`categoryId` + `Pageable` 추가 |
| 카테고리 필터 | 필터를 걸면 페이지네이션 개수가 안 맞음 | 클라이언트에서 응답을 받은 후 다시 필터링 | `categoryId`를 서버에 전달해 서버 사이드 필터링으로 변경 |
| 거래 유형 | "투자" 카테고리로 손실(지출)을 기록할 방법이 없음 | 거래 유형이 카테고리에 고정되어 파생됨 | 유형을 요청에서 직접 받아 카테고리와 독립적으로 저장 |
| 대시보드 잔액 | 지출만 등록했는데 "전월 대비 +100%"로 표시 | 전월 값이 0일 때 부호와 무관하게 항상 +100% 반환하는 계산 버그 | 부호를 실제 값 기준으로 반환하도록 수정, 잔액은 %가 아닌 금액 증감으로 표시 방식 변경 |
| 응답 DTO | 목록에서 특정 항목을 수정/삭제할 방법이 없음 | `MoneyLogResponse`/`CategoryResponse`에 `id`가 없었음 | `id`(및 `type`) 필드 추가 |
| Swagger | 커스텀 API 그룹이 항상 비어있음 | `pathsToMatch`/`packagesToScan`이 실제 경로·패키지와 다름(오타) | 올바른 값으로 수정 |
| 테스트 | `contextLoads` 테스트가 항상 실패 | `JWT_SECRET` 등 필수 환경변수가 테스트 환경에 없음 | `src/test/resources/application.yaml`로 H2 + 더미값 테스트 프로파일 구성 |
| 보안 | 관리자 계정 이메일/비밀번호가 코드에 하드코딩 | 초기 구현 당시 그대로 방치 | `.env` 기반 `app.admin.*` 프로퍼티로 주입 |

---

## 다음에 개선할 점

### 기능
- **카테고리 관리 UX 재검토**: 현재 카테고리는 고정된 18종 안에서만 추가/삭제가 가능하고, 이름을 자유롭게 새로 만들 수는 없다(백엔드가 `CategoryName` enum 기반이라). 사용자 정의 카테고리를 지원하려면 enum 대신 테이블 기반 카테고리 구조로 바꿔야 한다.
- **거래내역 응답의 `id` 부재 등, DTO 설계를 처음부터 "프론트가 뭘 할 수 있어야 하는가" 기준으로 검토**했으면 중간에 API를 두 번 고치는 일이 없었을 것.
- 월별 추이를 매번 N번 API 호출로 조립하는 대신, 백엔드에 다개월 통계 전용 엔드포인트를 만들면 더 효율적일 것.

### 테스트
- Google OAuth 로그인 흐름은 자동화 테스트가 없어서 여전히 수동 확인에 의존한다. `CustomOAuth2UserService`/`OAuth2LoginHandler`에 대한 단위 테스트를 추가하면 이번 같은 `LazyInitializationException`을 배포 전에 잡을 수 있었을 것이다.
- `CategoryController`/`CategoryService`에 대한 전용 테스트가 없다.
- 프론트엔드는 유닛/통합 테스트가 아직 없다.

### 배포
- Docker화, docker-compose, GitHub Actions CI/CD, AWS EC2 배포는 아직 손대지 못했다 — 남은 작업 중 가장 크다.
- 배포 환경에서는 `ddl-auto=update` 대신 명시적 마이그레이션(Flyway 등) 도입을 고려해야 한다.

### 문서
- 요구사항 정의서, ERD/API 설계 산출물은 아직 별도로 정리하지 못했다.
- README에 로컬 실행 방법(백엔드 `.env` 구성, 프론트 `.env.local`, MySQL 준비)을 정리해야 다른 사람이 바로 실행해볼 수 있다.

### 프로세스
- 이번 프로젝트에서 배운 가장 큰 교훈은 **"컴파일되고 화면에 나온다"와 "실제로 정확하게 동작한다"는 다르다**는 것이다. no-op 버그(수정/삭제가 아무 일도 안 함), 부호가 뒤집힌 계산, 트랜잭션 경계를 넘어서는 지연 로딩 접근은 전부 겉보기엔 정상이었다. 다음부터는 기능을 만들 때마다 실제 API를 호출해 응답을 눈으로 확인하는 걸 습관화해야겠다.

---

## Raspberry Pi 배포 회고

### 목표와 최종 구조

`main` push를 기준으로 GitHub Actions가 ARM64 이미지를 GHCR에 빌드하고, Raspberry Pi의 self-hosted runner가 k3s에 배포하도록 구성했다. 외부 HTTPS는 Pi에서 이미 운영 중인 Nginx가 도메인별로 라우팅한다.

```text
GitHub main push
  → GitHub-hosted runner가 linux/arm64 이미지 빌드
  → GHCR에 backend/frontend 이미지 push
  → Raspberry Pi self-hosted runner가 kubectl 실행
  → k3s의 MySQL, backend, frontend 갱신

Internet :80/:443
  → 기존 marketboard-nginx
  → Host: devvault.duckdns.org     → DevVault
  → Host: marketboard.duckdns.org  → MarketBoard
  → Host: junmoneylog.duckdns.org
       ├─ /api, /oauth2, /login/oauth2 → MoneyLog backend NodePort 30081
       └─ 나머지 경로                   → MoneyLog frontend NodePort 30080
```

### 발생한 문제와 해결

| 단계 | 증상 | 근본 원인 | 최종 해결 |
|---|---|---|---|
| k3s 시작 | 서비스가 계속 `activating` | Raspberry Pi 커널에서 memory cgroup v2가 비활성화됨 | 부팅 옵션에 `cgroup_enable=memory cgroup_memory=1`을 추가하고 재부팅 |
| k3s 인증 | `kubectl`이 자격 증명을 요구하고 kubeconfig가 없음 | k3s가 초기화 전에 종료되어 kubeconfig를 생성하지 못함 | memory cgroup 문제를 먼저 해결한 뒤 생성된 kubeconfig 사용 |
| Runner 서비스 | `status=200/CHDIR`로 실패 | Runner 파일은 `/home/jun` 아래 있는데 별도 `github-runner` 사용자로 실행 | 개인 Pi에서는 기존 `jun` 계정으로 서비스 실행 |
| 서비스 재등록 | `svc.sh uninstall` 후에도 unit이 남음 | `systemctl status` pager에서 `Ctrl+C`로 스크립트까지 중단 | `SYSTEMD_PAGER=cat PAGER=cat`으로 pager 없이 제거 |
| Runner의 kubectl | Actions에서 kubeconfig permission denied | `k3s` 그룹 권한이 실행 중인 Runner에 반영되지 않음 | kubeconfig를 `root:k3s 0640`으로 설정하고 Runner 재시작 |
| Docker 빌드 | GitHub ARM64 빌드에서 `./gradlew: Permission denied` | Windows에서 커밋된 `gradlew` 모드가 `100644` | Dockerfile에서 `chmod +x gradlew` 후 실행 |
| 외부 포트 | 80/443 포워딩 규칙이 기존 항목과 충돌 | 같은 공인 IP의 80/443을 기존 Nginx가 이미 사용 | 포워딩을 바꾸지 않고 Nginx `server_name`으로 도메인 분기 |
| k3s Ingress | cert-manager HTTP-01 challenge가 404 | 기존 Nginx를 확인하기 전에 Traefik이 외부 진입점이라고 가정 | k3s Ingress/cert-manager를 제거하고 기존 Nginx에서 TLS 종료 |
| Certbot | `certonly`을 전달했지만 기존 인증서 `renew`만 실행 | Compose certbot 서비스의 고정 entrypoint가 우선 | `--entrypoint certbot`으로 신규 발급 명령을 명시 |

### 잘못된 판단

1. 기존 80/443 리스너와 Nginx virtual host를 확인하기 전에 k3s Traefik을 외부 진입점으로 가정했다.
2. 개인 Pi에 불필요한 Runner 사용자 분리를 적용해 경로와 권한 문제를 늘렸다.
3. 컨테이너 이름, 컨테이너 내부 명령, Compose 서비스명, 명령 실행 디렉터리를 명확하게 구분하지 않았다.
4. 한 단계의 성공 조건을 확인하기 전에 다음 단계로 넘어갔다.

### 다음에 적용할 순서

1. `ss -lntp`, `docker ps`, 기존 Nginx 설정으로 80/443의 실제 소유자를 확인한다.
2. k3s의 `active`, 노드 `Ready`, memory cgroup을 검증한다.
3. 현재 사용자로 Runner를 서비스화하고 동일 사용자로 `kubectl get nodes`를 실행한다.
4. Repository Secrets와 Variables를 등록한다.
5. Docker 이미지를 Linux 환경에서 실제 빌드해 wrapper 권한을 확인한다.
6. Actions build 성공 후 deploy job과 Pod rollout을 확인한다.
7. 기존 Nginx에 HTTP 전용 `server_name` 블록을 먼저 추가한다.
8. Certbot webroot 방식으로 인증서를 발급한다.
9. HTTPS 블록을 적용하고 HTTP, HTTPS, API, Google OAuth를 각각 검증한다.

### 재사용할 점검 명령

```bash
# Pi와 k3s
uname -m
sudo systemctl is-active k3s
kubectl get nodes

# 외부 진입점
sudo ss -lntp | grep -E ':(80|443)\s'
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'

# Runner
sudo systemctl show actions.runner.parkjunss-moneylog.rasp4.service \
  -p User -p WorkingDirectory -p ActiveState

# MoneyLog
kubectl -n moneylog get deployments,pods,services,pvc
curl http://127.0.0.1:30081/actuator/health
curl -I http://127.0.0.1:30080

# Nginx
docker exec marketboard-nginx nginx -t
docker exec marketboard-nginx nginx -s reload
```

### Certbot 신규 발급 명령

MarketBoard Compose 프로젝트 디렉터리에서 실행한다.

```bash
docker compose run --rm \
  --entrypoint certbot \
  certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email wnstjd117@gmail.com \
  --agree-tos \
  --no-eff-email \
  -d junmoneylog.duckdns.org
```

### 검증 경계

완료:

- k3s 노드 `Ready`
- GitHub self-hosted runner 연결 및 서비스 실행
- Runner의 k3s 접근 권한 확보
- Gradle wrapper 권한 문제 해결
- GitHub Actions에서 k3s로 이어지는 배포 경로 구성
- 기존 Nginx를 사용하는 최종 네트워크 구조 확정
- `junmoneylog.duckdns.org` 인증서 신규 발급

남음:

- 최종 `junmoneylog.conf`의 `nginx -t` 통과
- Nginx reload 후 HTTP → HTTPS 리다이렉트 확인
- HTTPS 프론트엔드와 `/api` 백엔드 응답 확인
- 실제 Google OAuth 브라우저 로그인 확인
- Certbot 자동 갱신 후 Nginx reload 확인
