(function() {
    const CLIENT_ID = "225207566367-mnpl8thi10bvr3md5u29berh0e9unbi8.apps.googleusercontent.com";
    const API = "https://jiosaavn-api-x10c.onrender.com/api";

    // --- 1. CSS FOR THE POPUP UI ---
    const style = document.createElement('style');
    style.textContent = `
        :root { --sp-green: #1DB954; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
        body { background: #000; color: white; height: 100dvh; overflow: hidden; }
        
        #auth-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999;
            display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);
        }
        .login-card {
            background: #fff; color: #000; width: 90%; max-width: 360px;
            padding: 40px 20px; border-radius: 16px; text-align: center;
            box-shadow: 0 15px 40px rgba(0,0,0,0.5);
        }
        #google-btn-wrapper {
            margin-top: 30px; display: flex; justify-content: center; min-height: 40px;
        }
        #app-root { display: none; height: 100%; flex-direction: column; }
        header { padding: 45px 20px 10px; display: flex; justify-content: space-between; align-items: center; }
        .u-pfp img { width: 35px; height: 35px; border-radius: 50%; object-fit: cover; }
    `;
    document.head.appendChild(style);

    // --- 2. HTML STRUCTURE ---
    document.getElementById('root').innerHTML = `
        <div id="auth-overlay">
            <div class="login-card">
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" style="width:50px;">
                <h2 style="margin-top:20px; font-size:1.5rem; font-weight:800; letter-spacing:-0.5px;">Choose an account</h2>
                <p style="color:#666; font-size:0.9rem; margin-top:5px;">to continue to Tunify</p>
                
                <div id="google-btn-wrapper">
                    <div id="g_id_signin"></div>
                </div>

                <p style="font-size:0.75rem; color:#999; margin-top:30px; line-height:1.4;">
                    By continuing, you agree to Tunify's <br>Terms of Service.
                </p>
            </div>
        </div>

        <div id="app-root">
            <header>
                <div id="user-pfp" class="u-pfp"></div>
                <div style="background:var(--sp-green); color:#000; padding:5px 15px; border-radius:20px; font-weight:800; font-size:0.75rem;">Music</div>
            </header>
            <main style="padding:20px;">
                <h2 style="font-size:1.8rem; font-weight:900;">Recently Played</h2>
                <div id="list" style="margin-top:20px;"></div>
            </main>
        </div>
    `;

    // --- 3. HANDLE LOGIN DATA ---
    window.handleSignIn = (response) => {
        // Decode the JWT token from Google
        const user = JSON.parse(atob(response.credential.split('.')[1]));
        
        // Hide Login & Show App
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('app-root').style.display = 'flex';
        document.getElementById('user-pfp').innerHTML = `<img src="${user.picture}">`;
        
        // Fetch Content
        fetch(`${API}/search/songs?query=Trending`)
            .then(r => r.json())
            .then(d => {
                document.getElementById('list').innerHTML = d.data.results.slice(0,5)
                    .map(s => `<div style="padding:15px; background:#121212; border-radius:10px; margin-bottom:12px; font-weight:600;">${s.name}</div>`).join('');
            });
    };

    // --- 4. LOAD GOOGLE SDK & RENDER ---
    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
        google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: window.handleSignIn,
            ux_mode: "popup" // Force the popup flow
        });
        google.accounts.id.renderButton(
            document.getElementById("g_id_signin"),
            { theme: "outline", size: "large", shape: "pill", width: "280", text: "continue_with" }
        );
    };
    document.head.appendChild(script);

})();
