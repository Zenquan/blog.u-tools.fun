import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IconBrandGithub, IconMail, IconBrandX } from '@tabler/icons-react';
import WechatDialog from './WechatDialog';

const Social: FC = () => {
  return (
    <div className="mt-6 flex items-center space-x-3">
      <Link
        className="block p-1.5 rounded-full text-white bg-[#171515] transition-opacity hover:opacity-75"
        href="https://github.com/zenquan"
        target="_blank"
        title="Github"
      >
        <IconBrandGithub size={20} />
      </Link>
      <a
        className="block p-1.5 rounded-full text-white bg-[#e86125] transition-colors hover:opacity-75"
        href="mailto:jomsoucan@gmail.com"
        title="邮箱"
      >
        <IconMail size={20} />
      </a>
      <a
        className="block transition-opacity hover:opacity-75"
        href="https://assemble-platform.u-tools.fun"
        target="_blank"
        title="Assemble Platform"
      >
        <Image
          src="/logos/assemble-platform.png"
          alt="Assemble Platform"
          width={32}
          height={32}
        />
      </a>
      <a
        className="block transition-opacity hover:opacity-75"
        href="https://ai-service.u-tools.fun"
        target="_blank"
        title="AI Service"
      >
        <Image
          src="/logos/ai-service.png"
          alt="AI Service"
          width={32}
          height={32}
        />
      </a>
      {/* <Link
        className="block p-1.5 rounded-full text-white bg-[#0f1419] transition-colors hover:opacity-75"
        href="https://x.com/pengtikui"
        target="_blank"
        title="X (Twitter)"
      >
        <IconBrandX size={20} />
      </Link>
      <WechatDialog /> */}
    </div>
  );
};

export default Social;
