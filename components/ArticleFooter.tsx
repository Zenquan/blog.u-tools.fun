'use client';

import { FC } from 'react';
import { format } from 'date-fns';

interface ArticleFooterProps {
  date: string;
  update_at?: string;
}

const ArticleFooter: FC<ArticleFooterProps> = ({ date, update_at }) => {
  const formattedDate = format(new Date(date), 'yyyy 年 MM 月 dd 日');
  const formattedUpdateDate = format(new Date(update_at ? update_at : date), 'yyyy 年 MM 月 dd 日');

  return (
    <>
      <h2>作者注</h2>
      <p>本文章首次发布于 {formattedDate}，如有更新会在文末标注。如果您发现任何错误或有任何建议，欢迎在评论区留言或通过邮件联系我。</p>
      <blockquote>
        <p>最后更新：{formattedUpdateDate}</p>
        <p>本文章遵循 <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0</a> 协议</p>
      </blockquote>
    </>
  );
};

export default ArticleFooter; 