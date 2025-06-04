# **2팀**

![IMG_2474](https://github.com/user-attachments/assets/ac07bab3-7797-4cfa-93bf-b7ccd9c35f40)
[팀 노션 페이지](https://www.notion.so/danikim8/2-1ed826aac9d5803c9475ef1eac9835ab)

## **팀원 구성**

김단이 ([개인 Github 링크](https://github.com/danikim8))

김승준 ([개인 Github 링크](https://github.com/y10b))

백지연 ([개인 Github 링크](https://github.com/jyeon03))

오보람 ([개인 Github 링크](https://github.com/elisaohh))

윤세준 ([개인 Github 링크](https://github.com/YSJ0228))

임정빈 ([개인 Github 링크](https://github.com/jbinyim))

---

## **프로젝트 소개**

- "최애의 포토"는 디지털 시대의 새로운 수집 문화를 선도하는 디지털 포토카드 거래 플랫폼입니다. 사용자는 자신이 좋아하는 인물, 사물, 풍경 등의 디지털 포토카드를 손쉽게 구매하고 교환할 수 있으며, 나만의 카드 앨범을 꾸미고 자랑하는 재미도 함께 누릴 수 있습니다.
  본 프로젝트는 LCK 선수 카드 디지털 컬렉터블 플랫폼을 운영 중인 ‘레전더리스’의 실무 환경을 반영하여, 유저 간 C2C 카드 거래, 포인트 기반 구매 시스템, 유저 권한 분리, 알림 시스템, 검색/필터/정렬 기능, 무한 스크롤 등 실전에서 사용되는 핵심 기능을 직접 구현해보는 것을 목표로 합니다.

### 주요 기능

- 랜딩 페이지
  - 로그인 전 소개 페이지, 로그인 시 바로 서비스로 이동
- 인증
  - 회원가입, 로그인, 로그아웃 기능
- 포토 카드
  - 마켓에서 카드 검색/구매/판매/교환 가능
  - 카드 상세 관리 및 교환 제안 승인
  - 알림 기능
  - 내 갤러리에서 카드 관리
- 포인트
  - 1시간에 1번 랜덤 상자 뽑기 기능
  - 포인트 적립 및 구매 판매에 따라 포인트 차감 구현
- 생성 제한
  - 한 달에 카드 3장 생성 제한

---

## **팀원별 구현 기능 상세**

### **김단이**

- **인증 API**
  - Passport.js 기반 로컬 & OAuth(Google) 로그인 구현
  - JWT + Refresh Token 발급 및 쿠키 저장 처리
- **포인트 API**
  - 포인트 뽑기 쿨타임 체크 및 초기화 API 구현
  - 등급별 포인트 범위 랜덤 지급 로직 구현
- **유저 API**
  - 유저 정보 조회 (`GET /api/users/me`)

### **김승준**

- **에러 미들웨어 API**
  - 에러 상황에 맞는 커스텀 에러 유틸과 미들웨어 작성
- **구매**
  - 구매 상세 조회
  - 구매 요청
 
### **백지연**

- **모델 설계 및 정의**
  - ERD 설계
  - 스키마 정의
- **판매 기능**
  - 판매 포토카드 등록
  - 판매 수정
  - 판매 삭제
  - 판매 상세 조회
  - IDLE 목록 조회

### **오보람**

- **카드 조회 기능**
  - 마켓 플레이스 조회
  - 마이갤러리/나의 판매카드 조회
  - 필터 카운트
- **카드 생성 기능**
  - 포토카드 생성
  - 포토카드 생성 제한

### **윤세준**

- **포토카드 교환 기능**
  - 교환 요청 생성
  - 교환 요청 거절
  - 교환 요청 승인
  - 교환 요청 취소
- **포토카트 교환 페이지**
  - 교환 요청된 포토카드 조회


### **임정빈**

- **알림 기능**
  - 주요 이벤트가 발생할 때 알림.
  - 카드 구매
  - 교환 제안
  - 교환 승인
  - 교환 거절

---

## **파일 구조**
```
6-Photo-2-BE
├─ .DS_Store
├─ .http
├─ DB
├─ public
│  └─ dev
├─ src
│  ├─ .DS_Store
│  ├─ app.js
│  ├─ config
│  │  └─ passport.js
│  ├─ controllers
│  │  ├─ authController.js
│  │  ├─ exchangeController.js
│  │  ├─ notificationController.js
│  │  ├─ photoController.js
│  │  ├─ pointController.js
│  │  ├─ purchaseController.js
│  │  ├─ shopController.js
│  │  └─ userController.js
│  ├─ middlewares
│  │  ├─ .DS_Store
│  │  ├─ auth.middleware.js
│  │  ├─ error.middleware.js
│  │  ├─ passport
│  │  │  ├─ googleStrategy.js
│  │  │  ├─ jwtStrategy.js
│  │  │  └─ localStrategy.js
│  │  └─ upload.middleware.js
│  ├─ prisma
│  │  ├─ client.js
│  │  ├─ migrations
│  │  ├─ schema.prisma
│  │  └─ seed.js
│  ├─ repositories
│  │  ├─ exchangeRepository.js
│  │  ├─ notificationRepository.js
│  │  ├─ photoRepository.js
│  │  ├─ purchaseRepository.js
│  │  ├─ shopRepository.js
│  │  └─ userRepository.js
│  ├─ routes
│  │  ├─ authRoutes.js
│  │  ├─ exchangeRoutes.js
│  │  ├─ notificationRoute.js
│  │  ├─ photoRoutes.js
│  │  ├─ purchaseRoutes.js
│  │  ├─ shopRoutes.js
│  │  ├─ uploadRoutes.js
│  │  └─ userRoutes.js
│  ├─ services
│  │  ├─ authService.js
│  │  ├─ exchangeService.js
│  │  ├─ notificationService.js
│  │  ├─ photoService.js
│  │  ├─ pointService.js
│  │  ├─ purchaseService.js
│  │  ├─ shopService.js
│  │  └─ userService.js
│  └─ utils
│     ├─ customError.js
│     └─ timeFormat.js
└─ uploads

```
