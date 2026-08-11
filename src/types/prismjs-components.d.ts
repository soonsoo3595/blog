// prismjs 언어 컴포넌트는 타입 선언이 없는 순수 JS 사이드이펙트 모듈이라
// (NotionPage.tsx에서 sql/c++ 등 추가 문법을 등록하려고 직접 import함) 여기서
// 와일드카드로 선언해준다.
declare module "prismjs/components/*.min.js";
