# Research Blog

Astro 기반의 한국어·영어 정적 사이트. GitHub Pages로 배포합니다.

## 실행 및 확인

Node.js 24, pnpm 11.25.0을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

커밋 전 배포 결과 확인:

```sh
pnpm test
pnpm build
pnpm preview
```

- `dev`: 편집 중 미리보기
- `build`: 콘텐츠 검증 후 `dist/` 생성
- `preview`: 빌드 결과 확인. 변경 사항은 다시 빌드한 뒤 새로고침
- 한국어 경로: `/`, 영어 경로: `/en/`

## 편집 위치

| 내용 | 위치 |
| --- | --- |
| 문구·메뉴·연락처·리소스 설정 | `src/data/site.json` |
| CV 데이터 | `src/data/cv.json` |
| 한국어 글 | `content/ko/posts/` |
| 공개 대상 영어 글 | `content/en/posts/` |
| 번역 검토 기록 | `content/reviews.json` |
| 페이지 구성 | `src/pages/` |
| 공통 메뉴·푸터 | `src/layouts/Shell.astro` |
| 글 목록·CV 표시 | `src/components/` |
| 화면·모바일·인쇄 스타일 | `src/styles/site.css` |
| 이미지·아이콘 | `public/resources/` |
| 사이트 주소·빌드 설정 | `astro.config.mjs` |
| 빌드·배포 절차 | `.github/workflows/site.yml` |

`dist/`, `.astro/`, `node_modules/`는 자동 생성물이므로 직접 편집하지 않습니다.

## 문구와 리소스

`src/data/site.json`의 주요 필드:

- `name`, `prefix`, `description`: 이름·직함·홈 소개 및 기본 검색 설명
- `copy.ko`, `copy.en`: 언어별 제목·소개·푸터·버튼·안내 문구
- `copy.*.aboutDescription`, `copy.*.aboutParagraphs`: 소개 페이지의 설명과 문단 배열
- `navigation`: 메뉴 이름과 순서. 지원 경로는 `about`, `posts`, `cv`
- `brand`, `topics`, `contactLabels`: 브랜드 표시·연구 관심사·연락처 이름
- `resources.homeBackground`: 홈 배경 이미지
- `resources.profileImage`: 홈·소개 페이지의 프로필 사진
- `resources.favicon`: 사이트 아이콘

배경과 프로필 경로를 빈 문자열로 두면 해당 이미지를 숨깁니다. 리소스 파일은 `public/resources/` 아래에 두고, URL에는 `public`을 제외한 `/resources/...` 경로를 사용합니다. 경로의 대소문자는 실제 파일과 일치해야 합니다.

글 사진 예시:

```md
![사진 설명](/resources/images/post-slug/figure-01.jpg)
```

## 글 작성 및 영문 발행

한국어 글 파일명은 `YYYY-MM-DD-slug.md` 형식입니다. slug에는 영문·숫자·하이픈·밑줄을 사용합니다.

```md
---
title: 글 제목
subtitle: 부제
categories: Research
tags: [Topic]
---

본문
```

날짜는 파일명에서 읽습니다. 미래 날짜 예약 발행은 지원하지 않습니다. 수식 표기는 보존하지만 별도 수식 렌더러는 포함하지 않습니다.

### 번역 검토

```sh
pnpm content prepare YYYY-MM-DD-slug
```

`.review/<slug>/`에 원문 해시, 번역 지침(`prompt.md`), 초안(`translation.md`)을 준비합니다. 지침에 따라 초안을 번역하고 제목·본문·인용·이미지·코드를 직접 검토합니다.

검토 완료 후:

```sh
pnpm content approve YYYY-MM-DD-slug --reviewer "Reviewer"
pnpm content status
pnpm build
```

승인하면 영어 파일과 검토 기록이 갱신됩니다. 원문 또는 승인된 번역이 변경되면 영어 공개가 보류되므로 다시 검토·승인해야 합니다. 기존 초안은 덮어쓰지 않습니다. 새 원문으로 다시 시작할 때는 해당 `.review/<slug>/`를 정리한 뒤 `prepare`를 실행합니다.

- `.review/`는 Git과 배포에서 제외되는 로컬 작업 공간입니다.
- `content/reviews.json`의 해시를 직접 수정하지 않습니다.
- `legacy`는 이관된 번역 상태이며 새로 승인된 번역과 구분합니다.
- 글 파일명을 바꾸면 주소와 검토 기록의 키도 바뀝니다.

### 선택: API 번역

터미널 환경에 다음 변수를 설정합니다.

| 변수 | 용도 |
| --- | --- |
| `OPENAI_API_KEY` | 번역 API 인증 |
| `OPENAI_TRANSLATION_MODEL` | 사용할 모델 |

```sh
pnpm content translate YYYY-MM-DD-slug
```

OpenAI Responses API로 초안만 생성하며, 공개에는 별도 검토·승인이 필요합니다. 기존 편집 초안은 덮어쓰지 않습니다. 환경 변수 예시는 `.env.example`을 참고합니다. 이 명령은 `.env` 파일을 자동으로 읽지 않습니다.

## CV 관리

`src/data/cv.json`의 `sections`에는 `id`, `type`, `title`, `items`를 지정합니다. `items`는 항목별 객체 배열입니다.

```json
{
  "school": { "ko": "학교명", "en": "School name" },
  "from": "2020.03",
  "to": "2024.02"
}
```

| `type` | 필수 필드 | 주요 선택 필드 |
| --- | --- | --- |
| `education` | `school`, `from` | `to`, `department`, `lab`, `degree` |
| `experience` | `organization`, `role`, `from` | `to`, `department`, `course`, `project` |
| `publications` | `group`, `year`, `authorRole`, `title`, `venue` | `publicationType`, `award`, `impactFactor`, `url` |
| `patents` | `year`, `inventorRole`, `status`, `title`, `jurisdiction` | `url` |
| `service` | `year`, `organization`, `event`, `role` | — |
| `awards` | `year`, `event`, `distinction` | `toYear` |
| `skills` | `category`, `values` 배열 | — |

- 번역이 필요한 텍스트는 `{ "ko": "...", "en": "..." }`, 공통 텍스트는 문자열 하나로 관리합니다.
- 날짜는 `YYYY.MM`, 연도는 숫자입니다. 종료일이 없으면 `to: null`로 둡니다.
- 논문 섹션에는 `groups` 배열을 정의하고 각 항목의 `group`에 해당 `id`를 지정합니다.
- JCR 지표는 `impactFactor: { "year": 2024, "value": 5.8 }`처럼 기준 연도를 함께 기록합니다.
- 추가 설명은 `details` 배열, 강조 표시는 `featured: true`로 지정합니다.
- 배열 순서가 화면 순서입니다. 텍스트 필드는 Markdown이 아닌 일반 문자열입니다.
- CV 화면의 인쇄 기능으로 현재 언어의 PDF를 저장할 수 있습니다.

## 접속 통계

`src/data/site.json`의 `analytics.measurementId`에 GA4 측정 ID(`G-...`)를 지정합니다. 빈 값이면 분석 스크립트를 로드하지 않습니다. 수집은 운영 빌드에서 활성화됩니다.

측정 항목은 페이지 조회, `language_switch`, `cv_click`, `cv_print`입니다. 언어별 보고서가 필요하면 GA4에서 `content_language`, `target_language`를 이벤트 범위 맞춤 측정기준으로 등록합니다. 배포 후 실시간 보고서에서 수집을 확인합니다.

## 배포

`master` 브랜치에 push하면 테스트·빌드 성공 후 GitHub Pages에 자동 배포합니다. 다른 브랜치의 push와 pull request는 테스트·빌드만 수행합니다. 같은 브랜치의 워크플로는 동시에 실행하지 않으며, 진행 중인 실행은 취소하지 않습니다.

1. 저장소 Settings → Pages → Source를 **GitHub Actions**로 설정합니다.
2. 소스와 `pnpm-lock.yaml`을 `master` 브랜치에 커밋·푸시합니다.
3. Actions → **Build and publish research blog**에서 테스트·빌드·배포 결과를 확인합니다.

수동 재배포는 Run workflow에서 `master` 브랜치를 선택하고 `deploy`를 켭니다. 수동 실행에서 `deploy`를 끄면 검사만 수행합니다. 커밋만 하고 push하지 않으면 워크플로가 실행되지 않습니다.

## 공개 범위와 관리

- 저장소에 커밋하는 파일과 검토 기록은 공개됩니다. 공개 전 내용을 확인합니다.
- `public/`의 파일은 웹사이트에 그대로 배포됩니다.
- 인증 정보는 환경 변수 또는 GitHub Secrets로 관리하고 저장소에 넣지 않습니다.
- `.gitignore`는 이미 추적 중인 파일이나 과거 커밋의 공개를 취소하지 않습니다.
- 라이선스 고지는 [LICENSE](LICENSE)를 참고합니다.
