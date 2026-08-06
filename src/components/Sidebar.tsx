import ProfileCard from "./ProfileCard";
import About from "./About";
import CategoryList from "./CategoryList";

export default function Sidebar() {
  return (
    <aside className="sticky top-6 flex flex-col gap-5">
      <ProfileCard />
      <About />
      <CategoryList />
    </aside>
  );
}
