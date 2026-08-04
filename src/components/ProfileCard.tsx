import Image from "next/image";

export default function ProfileCard() {
  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="flex items-center gap-3">
        <Image
          src="/avatar-placeholder.svg"
          alt="프로필 사진"
          width={56}
          height={56}
          className="shrink-0 rounded-full"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold">이름</p>
          <p className="truncate text-xs text-foreground/60">
            user@example.com
          </p>
        </div>
      </div>
    </div>
  );
}
