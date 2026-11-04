# Blest · Research & Notes

차분한 연구자 포트폴리오와 한·영 연구 블로그. Astro 정적 사이트로 GitHub Pages에 배포합니다.

## 시작하기

Node.js 24와 pnpm 11.25.0을 사용합니다.

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm preview
```

최종 호스팅은 GitHub Pages입니다. `pnpm dev`는 편집 중 미리보기이고, `pnpm build` 후 `pnpm preview`는 **커밋 전에 실제 배포 산출물을 확인하는 미리보기**입니다. 둘 다 커밋이나 배포를 실행하지 않습니다. 디자인을 확인하고 수정한 뒤 다시 빌드하여 검토합니다. 휴대폰 폭, 언어 전환, 글의 그림·코드, CV 인쇄 화면을 함께 확인하세요.

한국어는 `/`, 영어는 `/en/`입니다. 소개, 글 목록, CV, 글 상세 페이지를 두 언어로 제공합니다. `dist/`가 배포 결과물입니다.


## 직접 편집하는 위치

| 바꾸려는 것 | 파일 또는 디렉터리 |
| --- | --- |
| 사이트의 모든 소개·제목·푸터·버튼·안내 문구, 연락처, 메뉴 | `src/data/site.json` |
| CV의 학력·경력·논문 등 실제 내용 | `src/data/cv.json` |
| 한국어 글 | `content/ko/posts/` |
| 검토 후 공개된 영어 글 | `content/en/posts/` |
| 배경·프로필·글 사진·아이콘 | `public/resources/` |
| 페이지 구성 | `src/pages/[...route].astro` |
| 공통 머리말·메뉴·푸터 | `src/layouts/Shell.astro` |
| 글 목록 구성 | `src/components/PostList.astro` |
| 색·폰트·간격·모바일·인쇄 스타일 | `src/styles/site.css` |
| 사이트 주소·정적 빌드 설정 | `astro.config.mjs` |

### 문구 편집

사이트 문구는 **`src/data/site.json` 한 곳**에서 관리합니다. 글 본문과 CV 경력 내용은 별도 콘텐츠 파일입니다.

- `description.ko/en`: 홈 소개 및 기본 검색 설명
- `intro.ko/en`: 소개 페이지의 짧은 소개
- `copy.ko/en`: 페이지 제목, 본문 안내, 버튼, 번역 상태, 푸터 등 모든 공통 문구
- `copy.ko.footer`, `copy.en.footer`: 하단의 짧은 소개
- `copy.ko.aboutParagraphs`, `copy.en.aboutParagraphs`: 소개 본문 문단 배열
- `navigation`: 메뉴 이름과 순서. 현재 지원 경로는 `about`, `posts`, `cv`입니다. 새 경로는 페이지 구현도 추가해야 합니다.
- `brand`, `name`, `topics`, `contactLabels`: 로고 문자·이름·연구 관심사·연락처 이름
- `resources`: 이미지·아이콘 경로

JSON은 쌍따옴표를 사용합니다. 마지막 항목 뒤에 쉼표를 붙이거나 주석을 쓰지 마세요. 문구를 지우고 싶으면 키를 삭제하기보다 값에 빈 문자열을 넣습니다. 한국어와 영어를 함께 갱신하세요.

### 배경과 프로필 사진

배경 이미지의 기본값은 기존 블로그의 모닥불 이미지입니다. `resources.homeBackground`를 빈 문자열로 바꾸면 배경을 숨깁니다.

프로필 사진을 `public/resources/images/my-profile.jpg`에 넣은 다음, `src/data/site.json`의 `resources.profileImage`를 `/resources/images/my-profile.jpg`로 지정합니다. 홈과 소개 페이지에 자동으로 표시됩니다. 빈 문자열이면 사진을 표시하지 않습니다. 예전 `profile.jpg`는 실제 인물 사진이 아니어서 자동 지정하지 않았습니다.

리소스 경로는 다음처럼 설정합니다. `resources` 안의 기존 값을 교체하세요.

```json
{
  "homeBackground": "/resources/images/bonfire.jpg",
  "profileImage": "/resources/images/my-profile.jpg",
  "favicon": "/resources/icons/favicon-32x32.png"
}
```

### 글에 사진 첨부

1. 글마다 폴더를 만들어 사진을 넣습니다. 예: `public/resources/images/my-post/experiment-01.jpg`
2. Markdown 본문에 다음을 작성합니다.

```md
![실험 환경을 구성한 모습](/resources/images/my-post/experiment-01.jpg)

사진 설명이나 출처를 여기에 적습니다.
```

한국어·영어 글에서 같은 사진 경로를 사용할 수 있고, 대체 설명은 각 언어에 맞게 씁니다. URL에 `public/`이나 Windows 드라이브 경로를 넣지 않습니다. 폴더·파일 이름은 소문자 영문과 숫자, 하이픈을 권장하며 실제 파일과 대소문자까지 일치해야 합니다. 큰 사진은 웹에 맞게 줄여서 넣으면 로딩이 빨라집니다.

### 편집 시 주의할 점

- `dist/`, `.astro/`, `node_modules/`는 자동 생성물이므로 직접 수정하지 않습니다.
- 글 파일 이름은 날짜와 주소에 쓰입니다. 발행 후 바꾸면 글 주소와 검토 기록의 키도 달라집니다.
- 승인된 영어 파일을 직접 고치거나 한국어 원문을 변경하면 영어 공개가 보류됩니다. 위 번역 검토 절차로 다시 승인하세요.
- `content/reviews.json`의 해시를 손으로 바꿔 검토를 건너뛰지 않습니다.
- `public/`에 놓은 파일은 전부 공개됩니다. API 키와 개인 자료는 넣지 않습니다.
- Windows에서는 같은 경로로 보여도 GitHub Pages에서는 대소문자가 다르면 사진·링크가 깨질 수 있습니다.
- 편집 후 `pnpm test`, `pnpm build`, `pnpm preview`로 확인하고 커밋합니다. `pnpm dev`는 저장 즉시 반영되며, 빌드 결과 미리보기는 다시 빌드한 뒤 새로고침해야 합니다.

## 한국어 글 → 영문 초안 → 직접 검토 → 발행

1. `content/ko/posts/YYYY-MM-DD-slug.md`에 한국어 글을 작성합니다. 파일 이름은 영문·숫자·하이픈·밑줄을 사용합니다.
2. `pnpm content prepare YYYY-MM-DD-slug`를 실행합니다.
3. `.review/YYYY-MM-DD-slug/prompt.md`를 이용해 Codex에서 번역하고, `.review/YYYY-MM-DD-slug/translation.md`에 초안을 저장합니다. 예: “이 prompt.md에 따라 영어 초안을 작성하고, 애매한 용어를 검토용으로 알려 줘.”
4. 초안의 제목, 본문, 수식, 인용, 그림, 코드가 원문과 맞는지 직접 검토하고 수정합니다.
5. 직접 검토를 완료한 뒤 아래 명령으로 승인합니다.

```sh
pnpm content approve YYYY-MM-DD-slug --reviewer "KyeongDeok Baek"
pnpm content status
pnpm build
```

승인 명령은 영문을 `content/en/posts/`로 복사하고 `content/reviews.json`에 원문·번역의 해시, 검토자, 승인 시각을 기록합니다. 승인 전 초안은 사이트에 포함하지 않습니다. 한국어 원문이나 승인된 영문이 변경되면 영어 버전은 자동으로 공개 대상에서 빠지고 한국어 본문에는 번역 검토 중 안내가 나타납니다. 다시 준비하고 검토·승인해야 재공개됩니다.

초안을 이미 준비한 상태에서는 덮어쓰지 않습니다. 새 원문으로 다시 시작하려면 `.review/<slug>/` 폴더를 보관하거나 삭제한 후 `prepare`를 다시 실행하세요. `.review/`는 로컬 작업 공간으로 Git과 배포에 포함되지 않습니다.

이전 블로그의 영어 글 두 편은 `legacy` 상태로 보존했으며, 새 검토를 거친 것으로 표시하지 않습니다. 변경되면 동일하게 재검토가 필요합니다.

### 선택: API로 영어 초안 생성

Codex에서 초안을 작성하면 별도 API 키가 필요하지 않습니다. 명령으로 생성하려면 터미널 환경에 `OPENAI_API_KEY`, `OPENAI_TRANSLATION_MODEL`을 지정하고 다음을 실행합니다.

```sh
pnpm content translate YYYY-MM-DD-slug
```

OpenAI Responses API를 호출해 **초안만** 만듭니다. 키나 모델이 없으면 명확한 안내와 함께 중단합니다. 실패하거나 응답이 불완전하면 기존 초안을 유지합니다. 키는 환경 변수로만 읽으며, `.env`를 자동으로 읽지는 않습니다. API 호출에는 별도 사용료가 발생할 수 있습니다. 실제 API 호출은 이 개편 작업에서 실행하지 않았습니다.

참고: [OpenAI 텍스트 생성](https://developers.openai.com/api/docs/guides/text).

### 한국어 글의 최소 형식

```md
---
title: 연구 노트 제목
subtitle: 선택적인 부제
categories: Research
tags: [IoT, ServiceComputing]
---

본문을 작성합니다.
```

날짜는 파일 이름에서 읽습니다. Markdown, 코드 블록, 수식 표기, 표와 이미지 경로를 보존합니다. 수식 렌더링은 아직 추가하지 않았습니다. 이미지 파일은 `public/resources/images/`에 놓고 `/resources/images/...`로 참조합니다. 글은 모두 날짜 내림차순으로 공개됩니다. 미래 날짜 예약 발행은 지원하지 않습니다.

## CV 갱신

`src/data/cv.json` 한 파일이 한국어·영어 CV를 만듭니다.

각 `sections` 항목은 `id`, `type`, `title`, **`items` 객체 배열**로 구성합니다. 한 항목의 번역은 그 객체 내부의 텍스트 필드에 함께 넣고, 날짜·연도·링크는 공통으로 관리합니다. 긴 Markdown `body`는 사용하지 않습니다.

학력(`type: "education"`)의 `items` 예시:

```json
[
  {
    "school": {
      "ko": "대전과학고등학교",
      "en": "Daejeon Science High School"
    },
    "from": "2010.02",
    "to": "2012.02"
  }
]
```

| `type` | 각 `items` 항목의 필드 |
| --- | --- |
| `education` | `school`, `from`, `to`; 선택: `department`, `lab`, `degree`, `details`, `featured` |
| `publications` | `group`, `year`, `authorRole`, `title`, `venue`; 선택: `publicationType`, `award`, `impactFactor`, `url`, `details`, `featured` |
| `experience` | `organization`, `role`, `from`, `to`; 선택: `department`, `course`, `project`, `details`, `featured` |
| `skills` | `category`, `values` 배열 |
| `awards` | `year`, `event`, `distinction`; 선택: `toYear`, `details` |
| `patents` | `year`, `inventorRole`, `status`, `title`, `jurisdiction`; 선택: `url`, `details` |
| `service` | `year`, `organization`, `event`, `role`; 선택: `details` |

- 번역이 필요한 텍스트는 `{ "ko": "한국어", "en": "English" }`로 씁니다. 양쪽이 같은 기관명·도구명은 `"KAIST"`처럼 문자열 하나로 쓸 수도 있습니다.
- `details`는 설명 항목 배열입니다. 예: `[{ "ko": "시험 문제 출제", "en": "Making exam problems" }]`.
- 날짜는 `YYYY.MM`, 연도는 숫자로 씁니다. `to: null`은 종료일이 정해지지 않은 재직 기록입니다. 예정된 종료일도 원문에 있으면 그대로 적습니다. 연도 범위는 `year`와 `toYear`로 나눕니다.
- 논문 섹션의 `groups`에 소제목을 정의하고 각 논문의 `group`에 해당 `id`를 넣습니다. `url`에 논문 링크를 넣으면 제목에 연결됩니다.
- 배열에 객체를 추가·삭제·이동하면 페이지 항목과 순서도 바뀝니다. `featured: true`는 강조 표시입니다. 텍스트는 일반 문자열이며 Markdown 문법을 넣지 않습니다.
- `pnpm build`는 번역 누락, 잘못된 월, 뒤바뀐 기간, 존재하지 않는 논문 그룹 등을 검사하고 문제가 있는 항목의 위치를 알려 줍니다.

- 현재 내용은 사용자가 제공한 2026년 11월 4일자 CV를 기준으로 갱신했습니다. 논문의 JCR 지표는 `impactFactor: { "year": 2024, "value": 5.8 }`처럼 기준 연도를 함께 기록합니다. 특허는 출원과 등록을 구분합니다.
- 논문·특허·과제의 영문 공식 제목은 공통 문자열로 보존하고, 기관명·직책·설명 등은 항목 안에서 한·영으로 관리합니다.
- CV 화면의 **인쇄 / PDF 저장**으로 현재 언어의 인쇄용 CV를 저장할 수 있습니다. 별도 PDF 파일 자동 생성 기능은 포함하지 않았습니다.

## 접속 통계와 댓글

`src/data/site.json`의 `analytics.measurementId`에 실제 GA4 측정 ID(`G-...`)를 넣습니다. 비어 있으면 Google Analytics 스크립트를 로드하지 않습니다.

운영 빌드에서 페이지 조회와 `content_language`, 언어 전환(`language_switch`), CV 열기(`cv_click`), CV 인쇄(`cv_print`)를 측정합니다. 방문자·인기 페이지·유입 경로는 GA4 관리 화면에서 확인합니다. `content_language`와 `target_language`를 보고서에 쓰려면 GA4의 이벤트 범위 맞춤 측정기준으로 등록하세요. 실제 수집 확인은 ID 입력·배포 후 GA4 실시간 보고서에서 해야 합니다. 댓글 기능은 없습니다.

참고: [GA4 페이지 조회](https://developers.google.com/analytics/devguides/collection/ga4/views), [이벤트 설정](https://developers.google.com/analytics/devguides/collection/ga4/events).

## GitHub Pages 배포

`.github/workflows/site.yml`은 push와 pull request에서 테스트와 빌드를 수행합니다. **배포는 수동 실행**으로 분리했습니다.

1. 저장소 설정 → Pages → Source를 **GitHub Actions**로 선택합니다.
2. 소스와 `pnpm-lock.yaml`을 저장소에 올립니다.
3. Actions → **Build and publish research blog** → Run workflow에서 배포할 소스 브랜치를 선택하고 `deploy`를 켭니다.
4. 빌드·테스트를 통과한 결과만 GitHub Pages에 배포합니다.

기존 사이트는 이 로컬 변경만으로 바뀌지 않습니다. 실제 GitHub 설정 변경과 배포는 아직 실행하지 않았습니다. [GitHub Pages 공식 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## 파일 안내

- `src/pages/`, `src/layouts/`, `src/styles/`: 새 사이트와 디자인
- `src/data/site.json`: 사이트 전체 문구, 메뉴, 이름·소개·연락처·연구 관심사·GA4 ID·리소스 경로
- `src/data/cv.json`: 한·영 CV의 단일 원본
- `content/`: 현재 발행용 Markdown과 검토 기록
- `scripts/content.mjs`: 번역 초안·승인·콘텐츠 점검
- `tests/`: 검토 전 공개 방지, 변경 감지, API 초안 경계 검증
- `public/resources/`: 배경·프로필·글 이미지·아이콘 등 모든 커스텀 리소스
- `public/`: 리소스와 사이트 소유권 확인 파일 등 그대로 배포하는 파일

이전 Jekyll 템플릿·설정·Ruby 의존성·배포 스크립트·중복 자산은 제거했습니다. 글은 `content/`에, 이미지는 `public/resources/`에 이관했으며 기존 글의 본문과 검토 기록은 보존했습니다. 옛 `/assets/` 이미지 경로는 렌더링 시 `/resources/`로 연결하므로 기존 글을 수정할 필요가 없습니다. 라이선스 고지는 `LICENSE`에 유지합니다.
