
## 2026-02-08
### Request
- **MainPage UI 개선**:
  - 수학 과정 선택 UI를 문제 메뉴처럼 한 줄로 정리 (Modal).
  - 참조 이미지 스타일 차용 (좌우 여백, 글자 색, FAB, 리스트 뷰 적용).
  - 정렬 버튼 제거 및 모바일 최적화.

### Implementation
- **MainPage.tsx**:
  - `Problem Create Modal`: Curriculum select layout changed to `flex-wrap` row.
  - Removed `Sort by Latest` UI controls.
  - Updated `Problem Card` structure to match list view design.
- **MainPage.css**:
  - Applied `#FF6B00` accent color.
  - Implemented FAB (`.btn-add-problem`) with fixed positioning.
  - Adjusted margins/padding for mobile (16px).
  - Styled `filter-controls` to hide scrollbars.
