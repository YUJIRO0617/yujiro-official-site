/* =========================
   SETTINGS
========================= */

/*
    Google Cloudで取得した
    YouTube Data API v3 のAPIキーを
    ここに入れてください。
*/

const YOUTUBE_API_KEY =
    "AIzaSyDci9AEK777d-XwJszXh-Tvtu5_25SRlkc";


/*
    YouTubeチャンネル

    @を付けたままでOKです。
*/

const YOUTUBE_HANDLE =
    "@YU_sing0617";


/*
    VIDEO欄に表示する本数
*/

const VIDEO_COUNT = 6;



/* =========================
   MENU
========================= */

const menuButton =
    document.getElementById("menuButton");

const nav =
    document.getElementById("nav");


menuButton.addEventListener(
    "click",
    () => {

        menuButton.classList.toggle(
            "active"
        );

        nav.classList.toggle(
            "active"
        );

    }
);


/* メニューをクリックしたら閉じる */

document
    .querySelectorAll(".nav a")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                menuButton.classList.remove(
                    "active"
                );

                nav.classList.remove(
                    "active"
                );

            }
        );

    });



/* =========================
   HEADER SCROLL
========================= */

const header =
    document.querySelector(".header");


window.addEventListener(
    "scroll",
    () => {

        if (window.scrollY > 50) {

            header.classList.add(
                "scrolled"
            );

        } else {

            header.classList.remove(
                "scrolled"
            );

        }

    }
);



/* =========================
   SCROLL REVEAL
========================= */

const revealElements =
    document.querySelectorAll(".reveal");


const revealObserver =
    new IntersectionObserver(
        entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add(
                        "active"
                    );

                    revealObserver.unobserve(
                        entry.target
                    );

                }

            });

        },
        {
            threshold: 0.1
        }
    );


revealElements.forEach(
    element => {

        revealObserver.observe(
            element
        );

    }
);



/* =========================
   YOUTUBE
========================= */

const videoGrid =
    document.getElementById(
        "youtubeVideos"
    );


/*
    APIからJSONを取得する
*/

async function fetchYouTube(
    url
) {

    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "YouTube API request failed"
        );

    }


    const data =
        await response.json();


    if (data.error) {

        console.error(
            data.error
        );

        throw new Error(
            data.error.message ||
            "YouTube API error"
        );

    }


    return data;

}



/*
    チャンネル情報を取得
*/

async function getChannel() {

    const url =
        new URL(
            "https://www.googleapis.com/youtube/v3/channels"
        );


    url.searchParams.set(
        "part",
        "contentDetails"
    );


    url.searchParams.set(
        "forHandle",
        YOUTUBE_HANDLE
    );


    url.searchParams.set(
        "key",
        YOUTUBE_API_KEY
    );


    const data =
        await fetchYouTube(
            url.toString()
        );


    if (
        !data.items ||
        data.items.length === 0
    ) {

        throw new Error(
            "YouTubeチャンネルが見つかりませんでした。"
        );

    }


    return data.items[0];

}



/*
    最新動画を取得
*/

async function getLatestVideos(
    uploadsPlaylistId
) {

    const url =
        new URL(
            "https://www.googleapis.com/youtube/v3/playlistItems"
        );


    url.searchParams.set(
        "part",
        "snippet,contentDetails"
    );


    url.searchParams.set(
        "playlistId",
        uploadsPlaylistId
    );


    url.searchParams.set(
        "maxResults",
        VIDEO_COUNT
    );


    url.searchParams.set(
        "key",
        YOUTUBE_API_KEY
    );


    const data =
        await fetchYouTube(
            url.toString()
        );


    if (!data.items) {

        return [];

    }


    return data.items
        .filter(item => {

            return (
                item.contentDetails &&
                item.contentDetails.videoId
            );

        })
        .map(item => {

            const snippet =
                item.snippet;


            const thumbnails =
                snippet.thumbnails;


            /*
                maxresがあれば使用。
                なければhighを使用。
            */

            let thumbnail =
                null;


            if (thumbnails.maxres) {

                thumbnail =
                    thumbnails.maxres.url;

            } else if (thumbnails.high) {

                thumbnail =
                    thumbnails.high.url;

            } else if (thumbnails.medium) {

                thumbnail =
                    thumbnails.medium.url;

            } else {

                thumbnail =
                    thumbnails.default.url;

            }


            return {

                id:
                    item.contentDetails.videoId,

                title:
                    snippet.title,

                publishedAt:
                    snippet.publishedAt,

                thumbnail:
                    thumbnail

            };

        });

}



/*
    日付を整形
*/

function formatDate(
    dateString
) {

    const date =
        new Date(dateString);


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}.${month}.${day}`;

}



/*
    HTMLエスケープ

    動画タイトルに
    HTML記号が入っていても
    そのままHTMLとして
    解釈されないようにする。
*/

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent = text;


    return div.innerHTML;

}



/*
    VIDEOカードを作成
*/

function createVideoCard(
    video
) {

    const article =
        document.createElement(
            "a"
        );


    article.className =
        "video-card reveal";


    article.href =
        `https://www.youtube.com/watch?v=${video.id}`;


    article.target =
        "_blank";


    article.rel =
        "noopener noreferrer";


    article.innerHTML = `

        <div class="video-image">

            <img
                src="${video.thumbnail}"
                alt="${escapeHTML(video.title)}"
                loading="lazy"
            >

            <div class="play-button">
                ▶
            </div>

        </div>

        <h3>
            ${escapeHTML(video.title)}
        </h3>

        <p>
            ${formatDate(video.publishedAt)}
        </p>

    `;


    return article;

}



/*
    YouTube動画を画面に表示
*/

async function loadYouTubeVideos() {

    /*
        APIキー未入力
    */

    if (
        !YOUTUBE_API_KEY ||
        YOUTUBE_API_KEY ===
        "ここにAPIキーを入力"
    ) {

        videoGrid.innerHTML = `

            <div class="loading">

                YouTube API KEY が
                設定されていません。

            </div>

        `;

        return;

    }


    try {

        /*
            チャンネル取得
        */

        const channel =
            await getChannel();


        /*
            アップロード動画の
            プレイリストID取得
        */

        const uploadsPlaylistId =
            channel
                .contentDetails
                .relatedPlaylists
                .uploads;


        /*
            最新動画取得
        */

        const videos =
            await getLatestVideos(
                uploadsPlaylistId
            );


        /*
            一旦クリア
        */

        videoGrid.innerHTML = "";


        /*
            動画がない場合
        */

        if (
            videos.length === 0
        ) {

            videoGrid.innerHTML = `

                <div class="loading">

                    動画がありません。

                </div>

            `;

            return;

        }


        /*
            動画を追加
        */

        videos.forEach(
            video => {

                const card =
                    createVideoCard(
                        video
                    );


                videoGrid.appendChild(
                    card
                );

            }
        );


        /*
            追加した動画にも
            アニメーションを適用
        */

        const newRevealElements =
            videoGrid.querySelectorAll(
                ".reveal"
            );


        newRevealElements.forEach(
            element => {

                revealObserver.observe(
                    element
                );

            }
        );


    } catch (error) {

        console.error(
            "YouTube error:",
            error
        );


        videoGrid.innerHTML = `

            <div class="loading">

                YouTube動画を
                取得できませんでした。

                <br><br>

                <a
                    href="https://www.youtube.com/@YU_sing0617"
                    target="_blank"
                    rel="noopener noreferrer">

                    YouTubeを開く →

                </a>

            </div>

        `;

    }

}



/*
    実行
*/

loadYouTubeVideos();
