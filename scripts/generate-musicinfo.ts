interface MusicInfo {
  title: string;
  artist: string;
  cover: string;
  src: string;
  platform?: string;
}

async function getRedirectUrl(shortUrl: string): Promise<string> {
  const response = await fetch(shortUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  return response.url;
}

async function extractMusicInfo(input: string): Promise<MusicInfo> {
  // 从输入中解析信息
  const titleMatch = input.match(/《(.+?)》/);
  const platformtMatch = input.match(/@(.+?)(?:\s|$)/);
  const urlMatch = input.match(/(https?:\/\/[^\s]+)/);

  if (!titleMatch || !urlMatch) {
    throw new Error('输入格式错误，请使用：《歌名》@歌手 URL 格式');
  }

  const title = titleMatch[1];
  let artist = '';
  const url = urlMatch[1];

  // 根据 URL 确定平台
  const platform = platformtMatch[0];

  // 处理短链接
  const fullUrl = url.includes('v.douyin.com') ? await getRedirectUrl(url) : url;

  // 从页面获取更多信息
  const response = await fetch(fullUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://www.douyin.com/',
    },
  });
  
  const html = await response.text();
  
  // 提取音频源和封面图
  let src = '';
  let coverUrl = '';

  // 从 HTML 中提取作者信息
  const artistHtmlMatch = html.match(/<span class="artist-name-max">([^<]+)<\/span>/);
  if (artistHtmlMatch) {
    artist = artistHtmlMatch[1];
  }

  // 从 _ROUTER_DATA 中提取信息
  const routerDataMatch = html.match(/<script>window\._ROUTER_DATA\s*=\s*({[\s\S]+?})<\/script>/);
  if (routerDataMatch) {
    try {
      const routerData = JSON.parse(routerDataMatch[1]);
      const audioInfo = routerData?.loaderData?.track_page?.audioWithLyricsOption;
      
      if (audioInfo) {
        src = audioInfo.url;
        // 从页面中提取封面图
        const coverMatch = html.match(/src="(https:\/\/p3-luna\.douyinpic\.com\/[^"]+)"/);
        if (coverMatch) {
          coverUrl = coverMatch[1];
        }
      }
    } catch (error) {
      console.error('Error parsing _ROUTER_DATA:', error);
    }
  }

  // 如果没有找到音频源，尝试其他方法
  if (!src) {
    // 尝试匹配完整的音频链接
    const audioUrlMatch = html.match(/https:\/\/v[0-9]+-luna\.douyinvod\.com\/[^"'\s]+(?:mime_type=audio_mp4)[^"'\s]*/);
    if (audioUrlMatch) {
      src = audioUrlMatch[0].replace(/&amp;/g, '&');
    }
  }

  // 如果没有找到封面图，尝试其他方法
  if (!coverUrl) {
    const coverMatch = html.match(/src="(https:\/\/p[0-9]-luna\.douyinpic\.com\/[^"]+)"/);
    if (coverMatch) {
      coverUrl = coverMatch[1];
    }
  }

  return {
    title,
    artist,
    cover: coverUrl,
    src,
    platform
  };
}

async function main() {
  try {
    const input = process.argv[2]; // 获取输入参数
    if (!input) {
      console.error('请提供音乐信息，格式：《歌名》@歌手 URL');
      process.exit(1);
    }

    const musicInfo = await extractMusicInfo(input);

    // 生成 MDX 代码
    const mdx = `<MusicPlayer
      title="${musicInfo.title}"
      artist="${musicInfo.artist}"
      cover="${musicInfo.cover}"
      platform="${musicInfo.platform}"
      src="${musicInfo.src}"
    />`;

    console.log('\n音乐信息已提取完成！\n');
    console.log('MDX 代码：\n');
    console.log(mdx);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
