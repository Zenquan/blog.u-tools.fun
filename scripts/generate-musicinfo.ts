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
  const platformMatch = input.match(/@(.+?)(?:\s|$)/);
  const urlMatch = input.match(/(https?:\/\/[^\s]+)/);

  if (!titleMatch || !urlMatch) {
    throw new Error('输入格式错误，请使用：《歌名》@歌手 URL 格式');
  }

  const title = titleMatch[1];
  let artist = '';
  const url = urlMatch[1];
  const platform = platformMatch ? platformMatch[1] : '';

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
    },
  });
  
  const html = await response.text();
  
  let src = '';
  let coverUrl = '';

  // 根据URL判断平台并使用相应的解析逻辑
  if (url.includes('qq.com')) {
    // QQ音乐解析逻辑
    const artistHtmlMatch = html.match(/<h2 class="singer_name">([^<]+)<\/h2>/);
    if (artistHtmlMatch) {
      artist = artistHtmlMatch[1];
    }

    const ssrDataMatch = html.match(/window\.__ssrFirstPageData__\s*=\s*({[\s\S]+?})<\/script>/);
    if (ssrDataMatch) {
      try {
        const ssrData = JSON.parse(ssrDataMatch[1]);
        if (ssrData.songList?.[0]) {
          const song = ssrData.songList[0];
          src = song.url;
          coverUrl = ssrData.metaData?.image || '';
        }
      } catch (error) {
        console.error('Error parsing __ssrFirstPageData__:', error);
      }
    }
  } else {
    // 抖音解析逻辑
    const artistHtmlMatch = html.match(/<span class="artist-name-max">([^<]+)<\/span>/);
    if (artistHtmlMatch) {
      artist = artistHtmlMatch[1];
    }

    const routerDataMatch = html.match(/<script>window\._ROUTER_DATA\s*=\s*({[\s\S]+?})<\/script>/);
    if (routerDataMatch) {
      try {
        const routerData = JSON.parse(routerDataMatch[1]);
        const audioInfo = routerData?.loaderData?.track_page?.audioWithLyricsOption;
        
        if (audioInfo) {
          src = audioInfo.url;
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