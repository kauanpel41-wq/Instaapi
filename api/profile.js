// api/profile.js — Roda na Vercel como serverless function
// URL: /api/profile?username={instagram_user}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9._]+$/.test(username)) {
    return res.status(400).json({ error: 'Username inválido' });
  }

  try {
    const response = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      {
        headers: {
          'x-ig-app-id': '936619743392459',
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
          Accept: '*/*',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          Referer: `https://www.instagram.com/${username}/`,
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Perfil não encontrado ou privado',
        status: response.status,
      });
    }

    const data = await response.json();

    if (!data?.data?.user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = data.data.user;

    // Retorna só o que precisamos (menos payload)
    return res.status(200).json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      biography: user.biography || '',
      profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url || '',
      is_verified: user.is_verified || false,
      follower_count: user.edge_followed_by?.count || user.follower_count || 0,
      following_count: user.edge_follow?.count || user.following_count || 0,
      media_count: user.edge_owner_to_timeline_media?.count || user.media_count || 0,
      // Já inclui os primeiros posts se vieram
      posts: (user.edge_owner_to_timeline_media?.edges || []).slice(0, 12).map(e => ({
        id: e.node.id,
        thumbnail: e.node.thumbnail_src || e.node.display_url || '',
        likes: e.node.edge_liked_by?.count || e.node.like_count || 0,
        comments: e.node.edge_media_to_comment?.count || e.node.comment_count || 0,
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
}
