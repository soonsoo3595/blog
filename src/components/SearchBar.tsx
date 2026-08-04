export default function SearchBar() {
  return (
    <form className="flex">
      <input
        type="search"
        placeholder="제목, 내용 검색"
        className="w-full rounded-lg border border-border bg-panel px-4 py-2 text-sm outline-none focus:border-accent"
      />
    </form>
  );
}
