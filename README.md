# Kyobo Book Clone

> HTML/CSS/JavaScript와 Kakao Book API를 활용해 구현한 API 연동형 도서 탐색 웹페이지

교보문고 UI를 참고해 메인 페이지, 도서 검색, 상품 상세 페이지, 구매 액션 흐름을 구현한 프론트엔드 포트폴리오 프로젝트입니다.  
단순 화면 복제보다 실제 외부 API 데이터를 불러오고, 검색 결과를 카드 UI로 렌더링하며, ISBN 기반으로 상세 페이지를 연결하는 사용자 흐름에 초점을 맞췄습니다.

[![GitHub Pages](https://img.shields.io/badge/Live_Demo-Kyobo_Book_Clone-4DAC27?style=flat-square&logo=github)](https://ebj0925-cyber.github.io/0331_01/)

---

## 목차

- [개요](#개요)
- [기술 스택](#기술-스택)
- [핵심 기능](#핵심-기능)
- [코드와 구현 포인트](#코드와-구현-포인트)
- [주요 화면](#주요-화면)
- [폴더 구조](#폴더-구조)
- [로컬 실행](#로컬-실행)
- [Portfolio](#portfolio)
- [링크](#링크)

---

## 개요

| 항목 | 내용 |
|---|---|
| **프로젝트명** | Kyobo Book Clone |
| **유형** | 개인 프론트엔드 포트폴리오 |
| **개발 기간** | 2025.03 |
| **목표** | 교보문고 UI를 참고해 API 연동형 도서 탐색 서비스 구현 |
| **구현 범위** | 메인 페이지, 상세 페이지, 검색/탭/메뉴/구매 액션, 리뷰/정책 영역 |
| **핵심 포인트** | Kakao Book API, JSON 렌더링, ISBN 라우팅, localStorage 데모 처리 |

### 프로젝트 방향

이 프로젝트는 "클론"이라는 이름을 사용하지만, 핵심은 단순 UI 복제가 아니라 **외부 API와 데이터 기반 화면 구성**입니다.

- Kakao Book API를 호출해 실제 도서 데이터를 가져옴
- API 응답 데이터를 카드형 UI로 렌더링
- 도서 클릭 시 ISBN을 URL 파라미터로 전달
- 상세 페이지에서 ISBN 기준으로 상품 정보를 다시 조회
- 수량 변경, 장바구니, 바로구매 등 쇼핑몰 액션 흐름 구현

---

## 기술 스택

| 구분 | 기술 | 역할 |
|---|---|---|
| **Markup** | HTML5 | 메인/상세 페이지 구조 설계 |
| **Style** | CSS3 | 레이아웃, 카드 UI, 고정 구매바, 반응형 보정 |
| **Language** | JavaScript | API 호출, DOM 렌더링, 이벤트 처리 |
| **Data** | JSON | 메인 비주얼, MD Pick 등 정적 콘텐츠 관리 |
| **API** | Kakao Book API | 도서 검색 및 ISBN 기반 상세 데이터 조회 |
| **Storage** | localStorage | 장바구니/구매 액션 데모 데이터 저장 |
| **Deploy** | GitHub Pages | 정적 웹페이지 배포 |

---

## 핵심 기능

### 1. Kakao Book API 검색

사용자가 입력한 키워드를 Kakao Book API에 전달해 도서 데이터를 비동기로 불러옵니다.

```js
async function fetchBooks(query) {
  const response = await fetch(
    `${KAKAO_BOOK_API_URL}?query=${encodeURIComponent(query)}&size=10`,
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("도서 데이터를 불러오지 못했습니다.");
  }

  const data = await response.json();
  return data.documents || [];
}
```

### 2. 도서 카드 렌더링

API 응답 데이터를 책 표지, 제목, 저자, 가격이 포함된 카드형 UI로 변환합니다.

- 썸네일이 없는 경우 대체 이미지 처리
- 판매가가 없는 경우 정가를 fallback으로 사용
- 카드 클릭 시 상세 페이지로 이동
- ISBN을 쿼리스트링으로 전달

### 3. 검색 이벤트와 예외 처리

사용자 입력 흐름을 고려해 검색어 미입력, 검색 결과 없음, API 오류 상황을 분기 처리했습니다.

| 상황 | 처리 |
|---|---|
| 검색어 없음 | 안내 메시지 출력 |
| 결과 없음 | 빈 상태 UI 또는 메시지 표시 |
| API 오류 | 에러 메시지와 기본 화면 표시 |
| ISBN 없음 | 상세 데이터 요청 중단 |

### 4. JSON 기반 메인 화면 구성

메인 비주얼, 퀵메뉴, 추천 콘텐츠는 HTML에 직접 고정하지 않고 JSON 데이터를 불러와 렌더링하는 방식으로 구성했습니다.

```js
fetch("./json/main_visual.json")
  .then((response) => response.json())
  .then((data) => {
    renderMainBanners(data.mainBanners);
    renderQuickMenus(data.quickMenus);
  });
```

### 5. ISBN 기반 상세 페이지

메인 도서 카드 클릭 시 `sub.html?isbn=...` 형태로 이동하고, 상세 페이지에서 해당 ISBN 값을 읽어 상품 정보를 조회합니다.

```js
const params = new URLSearchParams(window.location.search);
const isbn = params.get("isbn");
```

---

## 코드와 구현 포인트

### Decision 01. API 응답 데이터와 UI 구조 분리

도서 데이터를 HTML에 직접 작성하지 않고, API/JSON 응답을 JavaScript에서 가공해 화면에 렌더링했습니다.  
데이터가 바뀌어도 HTML 구조를 크게 수정하지 않고 유지할 수 있습니다.

### Decision 02. ISBN 기반 페이지 연결

리스트 페이지와 상세 페이지를 분리하고, URL 파라미터로 필요한 데이터 키만 전달했습니다.

```text
index.html
  -> sub.html?isbn=9788960179486
  -> sub.html?isbn=9791167140371
```

이 구조는 실제 쇼핑몰의 상품 리스트와 상세 페이지 흐름을 이해하기 좋게 보여줍니다.

### Decision 03. 상세 페이지 구매 UX 강화

상세 페이지에서는 사용자가 스크롤 중에도 구매 액션에 접근할 수 있도록 하단 고정 구매바를 구성했습니다.

- 총 상품 금액 실시간 표시
- 수량 `- / +` 컨트롤
- 선물하기 / 장바구니 / 바로드림 / 바로구매 버튼
- 구매 액션 시 토스트 피드백 표시

### Decision 04. CSS 역할 분리

처음에는 페이지 스타일이 길어지고 중복될 수 있어, CSS 파일의 역할을 명확히 분리했습니다.

| 파일 | 역할 |
|---|---|
| `reset.css` | 브라우저 기본 스타일 초기화 |
| `common.css` | 링크, 리스트, 버튼, 이미지, `.inner` 등 공통 기본값 |
| `layout.css` | 헤더, 푸터, 전체 메뉴 등 공통 레이아웃 |
| `main.css` | 메인 페이지 전용 스타일 |
| `sub.css` | 상세 페이지 전용 스타일 |

### Decision 05. 리스크 관리

포트폴리오 평가에서 감점 요소가 될 수 있는 부분도 함께 관리했습니다.

| 리스크 | 대응 |
|---|---|
| API 키 노출 | README와 포트폴리오에는 `YOUR_API_KEY` 형태로 설명 |
| 단순 클론처럼 보일 위험 | "API 연동형 도서 탐색 웹페이지"로 포지셔닝 |
| GitHub Pages 요청 제한 | 로컬 서버 캡처와 Pages URL을 함께 사용 |
| 서버 미연동 | localStorage 데모 처리로 범위 명확화 |

---

## 주요 화면

### 메인 페이지

- 교보문고 스타일의 헤더, GNB, 검색 영역
- 메인 비주얼 배너와 퀵메뉴
- 베스트, MD Pick, 교보문고 제작 도서, 이벤트 섹션

### 전체 메뉴

- 햄버거 버튼 클릭 시 좌측 사이드 메뉴 오픈
- 배경 딤 처리
- 카테고리와 주요 서비스 메뉴 구분

### 상세 페이지

- ISBN 기반 도서 상세 정보 렌더링
- 책 표지, 저자, 출판사, 가격, 혜택, 배송 정보 표시
- 상세정보 / 리뷰 / 교환반품 탭 구성
- 하단 고정 구매바 제공

### 구매 액션

- 수량 변경 시 총액 업데이트
- 장바구니/바로구매 클릭 시 토스트 피드백
- localStorage 기반 데모 저장 처리

---

## 폴더 구조

```text
0331_01-main/
├── index.html                 # 메인 페이지
├── sub.html                   # 도서 상세 페이지
├── README.md
│
├── css/
│   ├── reset.css              # 브라우저 기본 스타일 초기화
│   ├── common.css             # 공통 기본 스타일
│   ├── layout.css             # 헤더, 푸터, 전체 메뉴 레이아웃
│   ├── main.css               # 메인 페이지 스타일
│   └── sub.css                # 상세 페이지 스타일
│
├── fragments/
│   ├── header.html            # 공통 헤더
│   ├── footer.html            # 공통 푸터
│   ├── main_visual.html       # 메인 비주얼 영역
│   ├── main_best.html         # 베스트 도서 섹션
│   ├── main_books.html        # 추천 도서 섹션
│   ├── main_books02.html      # 추가 도서 섹션
│   ├── mdpick.html            # MD Pick 섹션
│   └── event.html             # 이벤트 섹션
│
├── js/
│   ├── common.js              # 공통 유틸/프래그먼트 로드 보조
│   ├── header.js              # 헤더, 전체 메뉴 인터랙션
│   ├── footer.js              # 푸터 로드
│   ├── main_visual.js         # 메인 비주얼, 퀵메뉴, API 렌더링
│   ├── main_best.js           # 베스트 도서 API 렌더링
│   ├── main_books.js          # 메인 도서 섹션 API 렌더링
│   ├── main_mdpick.js         # MD Pick JSON 렌더링
│   ├── event.js               # 이벤트 섹션 렌더링
│   ├── review.js              # 리뷰 데이터
│   └── sub.js                 # 상세 페이지, ISBN 조회, 구매 액션
│
├── json/
│   ├── main_visual.json       # 메인 배너/퀵메뉴 데이터
│   ├── mdpick.json            # MD Pick 데이터
│   └── sub.json               # 상세 페이지 보조 데이터
│
├── img/
│   ├── header/                # 로고, 검색, 장바구니, 마이 아이콘
│   ├── banner/                # 메인 배너 이미지
│   ├── quick/                 # 퀵메뉴 아이콘
│   ├── mdpick/                # MD Pick 이미지
│   ├── event/                 # 이벤트 배너 이미지
│   ├── footer/                # 푸터 로고/인증 이미지
│   ├── sub/                   # 상세 페이지 이미지/공유 아이콘
│   └── mid/                   # 중간 프로모션 이미지
│
└── portfolio/                 # PPT/PDF 및 포트폴리오 미리보기 이미지
```

---

## 로컬 실행

이 프로젝트는 정적 HTML/CSS/JavaScript 프로젝트입니다.  
`fetch()`로 JSON 파일과 프래그먼트를 불러오기 때문에 파일을 직접 더블클릭하기보다 로컬 서버로 실행하는 것을 권장합니다.

```text
1. 프로젝트 폴더 열기
2. VS Code에서 index.html 선택
3. Live Server 또는 로컬 서버 실행
```

로컬 서버 예시:

```bash
npx serve .
```

---

## Portfolio

- [PPT 다운로드](./portfolio/Kyobo_Book_Clone_Portfolio_3.pptx)
- [PDF 보기](./portfolio/Kyobo_Book_Clone_Portfolio_3.pdf)

### Preview

<img src="./portfolio/ppt_kyobo_img/슬라이드1.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드2.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드3.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드4.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드5.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드6.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드7.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드8.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드9.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드10.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드11.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드12.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드13.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드14.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드15.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드16.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드17.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드18.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드19.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드20.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드21.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드22.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드23.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드24.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드25.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드26.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드27.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드28.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드29.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드30.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드31.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드32.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드33.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드34.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드35.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드36.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드37.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드38.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드39.PNG" width="800" />
<img src="./portfolio/ppt_kyobo_img/슬라이드40.PNG" width="800" />



### Preview

아래 이미지는 실제 구현 화면을 캡처한 미리보기입니다.

<img src="./portfolio/screenshots/screenshot_01_main.png" width="800" />
<img src="./portfolio/screenshots/screenshot_02_main_books.png" width="800" />
<img src="./portfolio/screenshots/screenshot_03_mdpick.png" width="800" />
<img src="./portfolio/screenshots/screenshot_04_best.png" width="800" />
<img src="./portfolio/screenshots/screenshot_05_event.png" width="800" />
<img src="./portfolio/screenshots/screenshot_06_side_menu.png" width="800" />
<img src="./portfolio/screenshots/screenshot_07_detail_top.png" width="800" />
<img src="./portfolio/screenshots/screenshot_08_detail_info.png" width="800" />
<img src="./portfolio/screenshots/screenshot_09_related_books.png" width="800" />
<img src="./portfolio/screenshots/screenshot_10_review.png" width="800" />
<img src="./portfolio/screenshots/screenshot_11_purchase_toast.png" width="800" />
<img src="./portfolio/screenshots/screenshot_12_cart_toast.png" width="800" />
<img src="./portfolio/screenshots/screenshot_13_error_state.png" width="800" />

---

## 링크

| 구분 | 링크 |
|---|---|
| **Live Demo** | https://ebj0925-cyber.github.io/0331_01/ |
| **Main Page** | https://ebj0925-cyber.github.io/0331_01/index.html |
| **Sub Page 01** | https://ebj0925-cyber.github.io/0331_01/sub.html?isbn=9788960179486 |
| **Sub Page 02** | https://ebj0925-cyber.github.io/0331_01/sub.html?isbn=9791167140371 |
| **Repository** | https://github.com/ebj0925-cyber/0331_01 |

---

<p align="right">
  <sub>Kyobo Book Clone · API 기반 도서 탐색 웹페이지 · 조은정</sub>
</p>
