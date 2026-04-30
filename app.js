(function() {
    // --- 1. CORE SETUP ---
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover';

    const API = "https://jiosaavn-api-x10c.onrender.com/api";
    let queue = [];
    let currentIndex = -1;
    let favorites = JSON.parse(localStorage.getItem('tunify_favs')) || [];

    const encodeData = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    const decodeData = (str) => JSON.parse(decodeURIComponent(escape(atob(str))));

    // --- 2. PREMIUM CSS ---
    const style = document.createElement('style');
    style.textContent = `
        :root { --sp-green: #1DB954; --bg: #000; --glass: rgba(255, 255, 255, 0.1); --panel: #121212; }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html, body { width: 100%; height: 100%; background: #000; color: white; font-family: 'Segoe UI', Roboto, sans-serif; overflow: hidden; }

        /* SPLASH REMAINS VISIBLE BY DEFAULT */
        #splash-screen {
            position: fixed; inset: 0; background: #000; z-index: 9999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        #splash-logo {
            width: 80px; height: 80px; background: var(--sp-green);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            color: #000; font-size: 2.5rem; animation: splashPulse 1.5s ease-out infinite;
        }
        @keyframes splashPulse {
            0%, 100% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
        }

        #auth-screen {
            position: fixed; inset: 0; background: #000;
            z-index: 5000; display: none; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center;
        }
        #auth-screen.active { display: flex; }

        #app-root { display: none; flex-direction: column; height: 100dvh; width: 100%; }
        #app-root.visible { display: flex; }

        /* Profile Drawer */
        #profile-drawer {
            position: fixed; top: 0; left: 0; bottom: 0; width: 85%; max-width: 320px;
            background: var(--panel); z-index: 6000; transform: translateX(-100%);
            transition: transform 0.4s cubic-bezier(0.3, 0, 0, 1);
            display: flex; flex-direction: column;
        }
        #profile-drawer.open { transform: translateX(0); }
        #drawer-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 5999;
            display: none; backdrop-filter: blur(8px);
        }
        #drawer-overlay.active { display: block; }

        .drawer-header { padding: 50px 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .drawer-user { display: flex; align-items: center; gap: 15px; }
        .drawer-user img { width: 55px; height: 55px; border-radius: 50%; }

        .menu-item { padding: 16px 20px; display: flex; align-items: center; gap: 18px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
        .menu-item i { font-size: 1.2rem; width: 25px; color: #b3b3b3; }

        /* Navigation */
        header { padding: 55px 15px 15px; display: flex; align-items: center; justify-content: space-between; }
        .u-avatar { width: 34px; height: 34px; border-radius: 50%; overflow: hidden; background: #222; }
        .u-avatar img { width: 100%; height: 100%; object-fit: cover; }

        main { flex: 1; overflow-y: auto; padding: 0 15px 180px; }
        .section-title { font-size: 1.5rem; font-weight: 900; margin: 35px 0 15px; }
        .shelf { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 10px; }
        .shelf::-webkit-scrollbar { display: none; }
        
        .item { min-width: 155px; width: 155px; }
        .item img { width: 100%; aspect-ratio: 1/1; border-radius: 12px; object-fit: cover; }
        .item p { font-size: 0.85rem; font-weight: 700; margin-top: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        nav { position: fixed; bottom: 0; left: 0; right: 0; height: 80px; background: #000; display: flex; justify-content: space-around; align-items: center; z-index: 200; }
        .nav-link { color: #b3b3b3; display: flex; flex-direction: column; align-items: center; font-size: 0.65rem; gap: 6px; }
        .nav-link.active { color: white; }

        #mini-player { position: fixed; bottom: 85px; left: 10px; right: 10px; height: 60px; background: #282828; border-radius: 8px; display: none; align-items: center; padding: 0 10px; z-index: 150; }
        #mini-player.show { display: flex; }
        
        #player-full { position: fixed; inset: 0; z-index: 7000; transform: translateY(100%); transition: transform 0.5s; background: #121212; display: flex; flex-direction: column; }
        #player-full.active { transform: translateY(0); }
    `;
    document.head.appendChild(style);

    // --- 3. HTML ---
    document.getElementById('root').innerHTML = `
        <div id="splash-screen"><div id="splash-logo"><i class="fa-solid fa-music"></i></div></div>
        <div id="drawer-overlay" onclick="Tunify.closeDrawer()"></div>
        <div id="profile-drawer">
            <div class="drawer-header">
                <div class="drawer-user">
                    <img id="dr-pfp" src="">
                    <div><div id="dr-name" style="font-weight:800;">User</div><div style="font-size:0.8rem; color:#b3b3b3;">View profile</div></div>
                </div>
            </div>
            <div class="drawer-menu">
                <div class="menu-item"><i class="fa-solid fa-plus"></i> Add account</div>
                <div class="menu-item"><i class="fa-solid fa-bolt"></i> What's new</div>
                <div class="menu-item"><i class="fa-solid fa-chart-simple"></i> Listening stats</div>
                <div class="menu-item" onclick="Tunify.logout()" style="color:#ff4444; margin-top:20px;"><i class="fa-solid fa-power-off" style="color:#ff4444;"></i> Log out</div>
            </div>
        </div>

        <div id="auth-screen">
            <i class="fa-solid fa-headphones" style="font-size:4.5rem; color:var(--sp-green); margin-bottom:25px;"></i>
            <h1 style="font-size:2.2rem; font-weight:900;">Millions of songs.<br>Free on Tunify.</h1>
            <div onclick="Tunify.login()" style="background:white; color:black; padding:18px 32px; border-radius:50px; font-weight:800; display:flex; align-items:center; gap:12px; margin-top:50px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg" style="width:22px;"> Continue with Google
            </div>
        </div>

        <div id="app-root">
            <header>
                <div class="u-avatar" onclick="Tunify.openDrawer()" id="user-pfp"></div>
                <div style="background:var(--sp-green); color:black; padding:5px 14px; border-radius:20px; font-size:0.75rem; font-weight:800;">Music</div>
            </header>
            <main id="main-view"></main>
            <div id="mini-player">
                <img id="m-img" src="" style="width:44px; height:44px; border-radius:4px;">
                <div style="flex:1; margin-left:12px;"><div id="m-title" style="font-size:0.85rem; font-weight:700;"></div></div>
                <i class="fa-solid fa-play" id="m-play-btn" style="padding:15px;"></i>
            </div>
            <nav>
                <div class="nav-link active" onclick="Tunify.tab('home', this)"><i class="fa-solid fa-house"></i><span>Home</span></div>
                <div class="nav-link" onclick="Tunify.tab('search', this)"><i class="fa-solid fa-magnifying-glass"></i><span>Search</span></div>
                <div class="nav-link" onclick="Tunify.tab('favs', this)"><i class="fa-solid fa-lines-leaning"></i><span>Library</span></div>
            </nav>
        </div>

        <div id="player-full">
            <div style="padding: 50px 25px; flex:1; display:flex; flex-direction:column;">
                <i class="fa-solid fa-chevron-down" onclick="Tunify.closePlayer()" style="font-size:1.5rem; margin-bottom:50px;"></i>
                <img id="f-img" src="" style="width:100%; aspect-ratio:1/1; border-radius:12px;">
                <h2 id="f-title" style="margin-top:45px; font-size:1.6rem;"></h2>
                <div style="display:flex; justify-content:space-around; align-items:center; margin-top:auto;">
                    <i class="fa-solid fa-backward-step" onclick="Tunify.prev()" style="font-size:2.2rem;"></i>
                    <i class="fa-solid fa-play" id="f-play-btn" onclick="Tunify.toggle()" style="font-size:2.5rem;"></i>
                    <i class="fa-solid fa-forward-step" onclick="Tunify.next()" style="font-size:2.2rem;"></i>
                </div>
            </div>
        </div>
        <audio id="audio-engine"></audio>
    `;

    const audio = document.getElementById('audio-engine');
    const mainView = document.getElementById('main-view');

    // --- 4. LOGIC ---
    window.Tunify = {
        openDrawer: () => { document.getElementById('profile-drawer').classList.add('open'); document.getElementById('drawer-overlay').classList.add('active'); },
        closeDrawer: () => { document.getElementById('profile-drawer').classList.remove('open'); document.getElementById('drawer-overlay').classList.remove('active'); },
        login: () => { firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()); },
        logout: () => { Tunify.closeDrawer(); firebase.auth().signOut(); location.reload(); },
        tab: (t, el) => {
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            if(t==='home') Tunify.loadHome();
            if(t==='search') Tunify.loadSearch();
            if(t==='favs') Tunify.loadFavs();
        },
        loadHome: () => {
            mainView.innerHTML = `<h2 class="section-title">Trending</h2><div class="shelf" id="h1"></div><h2 class="section-title">Fresh Hits</h2><div class="shelf" id="h2"></div>`;
            fetchShelf('Trending', 'h1'); fetchShelf('Top Hits', 'h2');
        },
        loadSearch: () => {
            mainView.innerHTML = `<h2 class="section-title">Search</h2><input type="search" id="s-in" style="width:100%; padding:18px; border-radius:12px; background:#222; border:none; color:white;" placeholder="Artists, songs..."><div id="s-res" style="display:flex; flex-wrap:wrap; gap:12px; margin-top:20px;"></div>`;
            document.getElementById('s-in').oninput = (e) => { if(e.target.value.length > 2) fetchShelf(e.target.value, 's-res', true); };
        },
        loadFavs: () => {
            mainView.innerHTML = `<h2 class="section-title">Library</h2><div id="fav-res" style="display:flex; flex-wrap:wrap; gap:12px;"></div>`;
            if(favorites.length === 0) document.getElementById('fav-res').innerHTML = `<p style="color:#b3b3b3; width:100%; text-align:center;">Empty.</p>`;
            else renderList(favorites, 'fav-res', true);
        },
        play: (encSong, encList) => {
            const song = decodeData(encSong);
            queue = decodeData(encList);
            currentIndex = queue.findIndex(s => s.id === song.id);
            audio.src = song.downloadUrl[4].url;
            audio.play(); updateUI(song);
            document.getElementById('mini-player').classList.add('show');
        },
        toggle: () => audio.paused ? audio.play() : audio.pause(),
        next: () => { currentIndex = (currentIndex + 1) % queue.length; Tunify.play(encodeData(queue[currentIndex]), encodeData(queue)); },
        prev: () => { currentIndex = (currentIndex - 1 + queue.length) % queue.length; Tunify.play(encodeData(queue[currentIndex]), encodeData(queue)); },
        closePlayer: () => document.getElementById('player-full').classList.remove('active')
    };

    async function fetchShelf(q, id, grid = false) {
        const r = await fetch(`${API}/search/songs?query=${encodeURIComponent(q)}`);
        const d = await r.json();
        if(d.success) renderList(d.data.results, id, grid);
    }

    function renderList(list, id, grid) {
        const cont = document.getElementById(id); if(!cont) return;
        cont.innerHTML = list.map(s => `<div class="item" style="${grid ? 'width:47%;' : ''}" onclick="Tunify.play('${encodeData(s)}', '${encodeData(list)}')"><img src="${s.image[2].url}"><p>${s.name}</p></div>`).join('');
    }

    function updateUI(s) {
        document.getElementById('m-img').src = s.image[0].url;
        document.getElementById('m-title').innerText = s.name;
        document.getElementById('f-img').src = s.image[2].url;
        document.getElementById('f-title').innerText = s.name;
    }

    audio.onplay = () => { document.getElementById('f-play-btn').className = 'fa-solid fa-pause'; document.getElementById('m-play-btn').className = 'fa-solid fa-pause'; };
    audio.onpause = () => { document.getElementById('f-play-btn').className = 'fa-solid fa-play'; document.getElementById('m-play-btn').className = 'fa-solid fa-play'; };

    // --- 5. THE FIX: ZERO-FLASH BOOTSTRAP ---
    firebase.initializeApp({ apiKey: "AIzaSyDWI8raVFZ4HEzxAUYGfY1vOfqHoPvQiD0", authDomain: "tunify-8592f.firebaseapp.com", projectId: "tunify-8592f" });
    
    firebase.auth().onAuthStateChanged(async (user) => {
        const splash = document.getElementById('splash-screen');
        const auth = document.getElementById('auth-screen');
        const app = document.getElementById('app-root');

        // Check if there was a redirect result pending
        try { await firebase.auth().getRedirectResult(); } catch(e) {}

        if (user) {
            auth.classList.remove('active');
            app.classList.add('visible');
            document.getElementById('user-pfp').innerHTML = `<img src="${user.photoURL}">`;
            document.getElementById('dr-pfp').src = user.photoURL;
            document.getElementById('dr-name').innerText = user.displayName;
            Tunify.loadHome();
        } else {
            app.classList.remove('visible');
            auth.classList.add('active'); // ONLY show auth if no user is found
        }

        // Hide splash only AFTER the above logic is settled
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 600);
        }, 1000);
    });

})();
        
