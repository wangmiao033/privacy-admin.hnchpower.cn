import { PoliciesLoadingShell } from "@/app/(dashboard)/policies/policies-loading-shell";

/** 路由切换时的瞬时骨架（不重复请求 profile，邮箱位留空） */
export default function PoliciesLoading() {
  return <PoliciesLoadingShell email={null} />;
}
