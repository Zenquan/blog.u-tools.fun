import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search as SearchIcon } from 'lucide-react';

const LIST = [
  {
    title: '首页',
    href: '/',
  },
  {
    title: '博客',
    href: '/blog',
  },
  {
    title: '周刊',
    href: '/weekly',
  },
  // {
  //   title: '关于',
  //   href: '/about',
  // },
];

const Menu: FC = () => {
  return (
    <nav className="bg-white/30 backdrop-blur-sm shadow-sm py-4 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-2 flex items-center justify-between">
        <Link href="/" className="flex shadow-sm rounded-full overflow-hidden border">
          <Image src="/icons/favicon.png" alt="Zenquan" width={34} height={34} />
        </Link>
        <div className="flex items-center gap-2">
          <ul className="flex px-3 bg-white rounded-full shadow-lg shadow-gray-100 ring-1 ring-gray-100">
            {LIST.map((item) => (
              <li
                key={item.title}
                className="px-3 py-2 text-sm text-gray-700 transition-colors hover:text-black"
              >
                <Link href={item.href}>{item.title}</Link>
              </li>
            ))}
          </ul>
          <Link
            href="/search"
            className="p-2 bg-white rounded-full shadow-lg shadow-gray-100 ring-1 ring-gray-100 text-gray-700 hover:text-black transition-colors"
          >
            <SearchIcon size={20} />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Menu;
