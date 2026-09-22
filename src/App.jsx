import React, { useEffect, useMemo, useState } from 'react';

import {
  getUsers,
  saveUser,
  login,
  logout,
  session,
  getProgress,
  saveProgress
} from './services/storage';

import {
  difficulties,
  puzzleList,
  gridFor,
  puzzleSvgData
} from './data/puzzles';

import {
  clickSound,
  correctSound,
  wrongSound,
  pieceSound,
  winSound,
  startMusic,
  stopMusic,
  unlockAudio,
  speakCorrect,
  speakWrong,
  speakPuzzleComplete,
  speakMathInstruction,
  speakPuzzleInstruction,
  speak
} from './services/sound';


/* =========================================================
   LOGO
   ========================================================= */

const Logo = () => (
  <div className="logo">
    <span>J</span>
    <span>U</span>
    <span>M</span>
    <span>A</span>
    <span>T</span>
    <span>I</span>
  </div>
);


/* =========================================================
   UTILIDADES
   ========================================================= */

const shuffle = a => {
  const b = [...a];

  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }

  return b;
};


const objects = [
  { icon: '🍎', one: 'manzana', many: 'manzanas', gender: 'f' },
  { icon: '🐶', one: 'perrito', many: 'perritos', gender: 'm' },
  { icon: '🐠', one: 'pez', many: 'peces', gender: 'm' },
  { icon: '🦋', one: 'mariposa', many: 'mariposas', gender: 'f' },
  { icon: '🚗', one: 'carrito', many: 'carritos', gender: 'm' },
  { icon: '⭐', one: 'estrella', many: 'estrellas', gender: 'f' },
  { icon: '🎈', one: 'globo', many: 'globos', gender: 'm' },
  { icon: '🐰', one: 'conejito', many: 'conejitos', gender: 'm' },
  { icon: '🍌', one: 'plátano', many: 'plátanos', gender: 'm' },
  { icon: '🐱', one: 'gatito', many: 'gatitos', gender: 'm' }
];


const randomObject = () =>
  objects[Math.floor(Math.random() * objects.length)];


const initialChallenge = (type = 'sum') => {
  const item = randomObject();

  let a = 2;
  let b = 1;
  let op = '+';

  if (type === 'sub') {
    a = 5;
    b = 2;
    op = '-';
  }

  if (type === 'count') {
    a = 4;
    b = 0;
    op = 'count';
  }

  if (type === 'seq') {
    a = 1;
    b = 1;
    op = 'seq';
  }

  return {
    a,
    b,
    op,
    answer: '',
    feedback: '',
    item,
    locked: false
  };
};


/* =========================================================
   APP
   ========================================================= */

function App() {

  const s = session();

  const remembered = (() => {
    try {
      return JSON.parse(
        localStorage.getItem('jumati_remember') || 'null'
      );
    } catch {
      return null;
    }
  })();


  const [screen, setScreen] = useState(s ? 'menu' : 'home');
  const [current, setCurrent] = useState(s);
  const [msg, setMsg] = useState('');


  const [form, setForm] = useState({
    name: '',
    user: '',
    password: '',
    age: '5',
    gender: 'nino',
    avatar: '🦁'
  });


  const [auth, setAuth] = useState({
    user: remembered?.user || '',
    password: remembered?.password || ''
  });


  const [remember, setRemember] = useState(Boolean(remembered));
  const [showPassword, setShowPassword] = useState(false);

  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [difficulty, setDifficulty] = useState(8);
  const [puzzleKey, setPuzzleKey] = useState(0);

  const [math, setMath] = useState(initialChallenge('sum'));
  const [gameType, setGameType] = useState('sum');


  const progress = current
    ? getProgress(current.user)
    : {
        stars: 0,
        completed: [],
        mathCorrect: 0
      };


  /* =======================================================
     MÚSICA
     ======================================================= */

  useEffect(() => {

    const musicalScreens = {
      menu: 0,
      games: 1,
      puzzles: 2,
      difficulty: 2,
      achievements: 3,
      progress: 3
    };

    if (musicalScreens[screen] === undefined) {
      return;
    }

    try {
      startMusic(
        musicalScreens[screen] +
        (current?.gender === 'nina' ? 4 : 0)
      );
    } catch (error) {
      console.warn(error);
    }

    return () => {
      stopMusic();
    };

  }, [screen, current?.gender]);


  /* =======================================================
     VOZ DE MATEMÁTICAS
     ======================================================= */

  useEffect(() => {

    if (screen !== 'math') {
      return;
    }

    const theme = {
      sum: 0,
      sub: 1,
      count: 2,
      seq: 3
    }[gameType] ?? 0;

    try {
      startMusic(
        theme +
        (current?.gender === 'nina' ? 4 : 0)
      );
    } catch (error) {
      console.warn(error);
    }


    const t = setTimeout(() => {

      try {
        speakMathInstruction(
          gameType,
          current?.gender,
          math.a,
          math.b,
          math.item
        );
      } catch (error) {
        console.warn(error);
      }

    }, 250);


    return () => {

      clearTimeout(t);

      stopMusic();

      try {
        window.speechSynthesis?.cancel();
      } catch (error) {
        console.warn(error);
      }

    };

  }, [screen, gameType]);


  /* =======================================================
     NAVEGACIÓN
     ======================================================= */

  const go = async screenName => {

    /*
      Primero navegamos.
      El audio nunca debe impedir el cambio de pantalla.
    */

    setMsg('');
    setScreen(screenName);

    try {
      await unlockAudio();
      clickSound();
    } catch (error) {
      console.warn('Audio no disponible:', error);
    }
  };


  /* =======================================================
     LOGIN
     ======================================================= */

  const doLogin = e => {

    e.preventDefault();

    const u = login(
      auth.user,
      auth.password
    );

    if (!u) {
      setMsg('Usuario o contraseña incorrectos');
      return;
    }


    if (remember) {

      localStorage.setItem(
        'jumati_remember',
        JSON.stringify(auth)
      );

    } else {

      localStorage.removeItem(
        'jumati_remember'
      );
    }


    setCurrent(u);

    go('menu');
  };


  /* =======================================================
     REGISTRO
     ======================================================= */

  const register = e => {

    e.preventDefault();


    if (
      !form.name ||
      !form.user ||
      !form.password
    ) {
      setMsg('Completa todos los datos');
      return;
    }


    if (
      getUsers().some(
        u =>
          u.user.toLowerCase() ===
          form.user.toLowerCase()
      )
    ) {
      setMsg('Ese usuario ya existe');
      return;
    }


    const u = {
      ...form
    };


    saveUser(u);

    login(
      u.user,
      u.password
    );

    setCurrent(u);

    go('menu');
  };


  /* =======================================================
     COMPLETAR ROMPECABEZAS
     ======================================================= */

  const completePuzzle = () => {

    const p = getProgress(current.user);

    const id =
      `${selectedPuzzle.id}-${difficulty}`;


    if (!p.completed.includes(id)) {

      p.completed.push(id);

      p.stars += 3;

      saveProgress(
        current.user,
        p
      );
    }


    setScreen('complete');
  };


  /* =======================================================
     NUEVO RETO
     ======================================================= */

  const newMath = async () => {

    const item = randomObject();

    let a =
      1 + Math.floor(Math.random() * 8);

    let b =
      1 + Math.floor(Math.random() * 5);

    let op = '+';


    if (gameType === 'sub') {

      if (b > a) {
        [a, b] = [b, a];
      }

      op = '-';
    }


    if (gameType === 'count') {

      a =
        1 + Math.floor(Math.random() * 9);

      b = 0;

      op = 'count';
    }


    if (gameType === 'seq') {

      a =
        1 + Math.floor(Math.random() * 4);

      b =
        1 + Math.floor(Math.random() * 2);

      op = 'seq';
    }


    setMath({
      a,
      b,
      op,
      answer: '',
      feedback: '',
      item,
      locked: false
    });


    try {

      await unlockAudio();

      setTimeout(() => {

        speakMathInstruction(
          gameType,
          current?.gender,
          a,
          b,
          item
        );

      }, 100);

    } catch (error) {
      console.warn(error);
    }
  };


  /* =======================================================
     RESULTADO ESPERADO
     ======================================================= */

  const expected = () =>
    math.op === '+'
      ? math.a + math.b
      : math.op === '-'
        ? math.a - math.b
        : math.op === 'count'
          ? math.a
          : math.a + math.b * 2;


  /* =======================================================
     COMPROBAR
     ======================================================= */

  const checkMath = async () => {

    if (math.locked) {
      return;
    }


    try {
      await unlockAudio();
    } catch (error) {
      console.warn(error);
    }


    if (
      Number(math.answer) ===
      expected()
    ) {

      correctSound();

      speakCorrect(
        current?.gender
      );


      const p =
        getProgress(current.user);

      p.mathCorrect += 1;
      p.stars += 1;

      saveProgress(
        current.user,
        p
      );


      setMath({
        ...math,
        feedback: 'correct',
        locked: true
      });

    } else {

      wrongSound();

      speakWrong(
        current?.gender
      );


      setMath({
        ...math,
        feedback: 'wrong',
        locked: false
      });
    }
  };


  /* =======================================================
     INICIAR JUEGO
     ======================================================= */

  const startGame = async type => {

    try {
      await unlockAudio();
    } catch (error) {
      console.warn(error);
    }

    setGameType(type);

    setMath(
      initialChallenge(type)
    );

    go('math');
  };


  /* =======================================================
     CONTENEDOR
     ======================================================= */

  const shell = content => (

    <main className="app">

      <section className="screen">

        <div className="cloud c1" />

        <div className="cloud c2" />

        {content}

        <div className="ground" />

      </section>

    </main>
  );


  /* =======================================================
     HOME
     ======================================================= */

  if (screen === 'home') {

    return shell(

      <div className="center">

        <Logo />

        <h1>
          ¡Bienvenido a JUMATI!
        </h1>

        <p className="slogan">
          ¡Juega, aprende y supera retos!
        </p>


        <div className="characters">

          <b>👦</b>

          <b className="lion">
            🦁
          </b>

          <b>👧</b>

        </div>


        <div className="actions">

          <button
            type="button"
            className="btn blue"
            onClick={() => go('login')}
          >
            ▶ Iniciar sesión
          </button>


          <button
            type="button"
            className="btn green"
            onClick={() => go('register')}
          >
            ✨ Crear cuenta
          </button>

        </div>


        <p className="pill">
          ⭐ Pequeños retos, grandes logros ⭐
        </p>

      </div>
    );
  }


  /* =======================================================
     LOGIN
     ======================================================= */

  if (screen === 'login') {

    return shell(

      <div className="card-wrap">

        <button
          type="button"
          className="back"
          onClick={() => go('home')}
        >
          ←
        </button>


        <Logo />


        <form
          className="card"
          onSubmit={doLogin}
        >

          <div className="avatar-top">
            🦁
          </div>


          <h2>
            ¡Hola de nuevo!
          </h2>


          <p>
            Ingresa para seguir jugando
          </p>


          <label>
            👤 Usuario
          </label>


          <input
            value={auth.user}
            onChange={e =>
              setAuth({
                ...auth,
                user: e.target.value
              })
            }
          />


          <label>
            🔐 Contraseña
          </label>


          <div className="password-box">

            <input
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              value={auth.password}
              onChange={e =>
                setAuth({
                  ...auth,
                  password: e.target.value
                })
              }
            />


            <button
              type="button"
              aria-label="Mostrar u ocultar contraseña"
              onClick={() =>
                setShowPassword(
                  value => !value
                )
              }
            >
              {showPassword
                ? '🙈'
                : '👁️'}
            </button>

          </div>


          <label className="remember">

            <input
              type="checkbox"
              checked={remember}
              onChange={e =>
                setRemember(
                  e.target.checked
                )
              }
            />

            <span>
              Recordar contraseña
            </span>

          </label>


          {msg && (
            <div className="error">
              {msg}
            </div>
          )}


          <button
            type="submit"
            className="btn blue"
          >
            ▶ Ingresar
          </button>


          <button
            type="button"
            className="link"
            onClick={() =>
              go('register')
            }
          >
            ¿No tienes cuenta?{' '}
            <b>
              Crear cuenta
            </b>
          </button>

        </form>

      </div>
    );
  }


  /* =======================================================
     REGISTRO
     ======================================================= */

  if (screen === 'register') {

    return shell(

      <div className="card-wrap wide">

        <button
          type="button"
          className="back"
          onClick={() => go('home')}
        >
          ←
        </button>


        <Logo />


        <form
          className="card"
          onSubmit={register}
        >

          <h2>
            ✨ Crea tu personaje
          </h2>


          <div className="grid">

            <div>

              <label>
                Nombre
              </label>

              <input
                value={form.name}
                onChange={e =>
                  setForm({
                    ...form,
                    name: e.target.value
                  })
                }
              />

            </div>


            <div>

              <label>
                Usuario
              </label>

              <input
                value={form.user}
                onChange={e =>
                  setForm({
                    ...form,
                    user: e.target.value
                  })
                }
              />

            </div>


            <div>

              <label>
                Contraseña
              </label>

              <input
                type="password"
                value={form.password}
                onChange={e =>
                  setForm({
                    ...form,
                    password: e.target.value
                  })
                }
              />

            </div>


            <div>

              <label>
                Edad
              </label>

              <select
                value={form.age}
                onChange={e =>
                  setForm({
                    ...form,
                    age: e.target.value
                  })
                }
              >

                <option>4</option>
                <option>5</option>
                <option>6</option>

              </select>

            </div>

          </div>


          <h3>
            Elige tu perfil
          </h3>


          <div className="choice">

            <button
              type="button"
              className={
                form.gender === 'nino'
                  ? 'selected'
                  : ''
              }
              onClick={() =>
                setForm({
                  ...form,
                  gender: 'nino',
                  avatar: '🧒'
                })
              }
            >
              👦 Niño
            </button>


            <button
              type="button"
              className={
                form.gender === 'nina'
                  ? 'selected pink'
                  : ''
              }
              onClick={() =>
                setForm({
                  ...form,
                  gender: 'nina',
                  avatar: '👧'
                })
              }
            >
              👧 Niña
            </button>

          </div>


          <div className="avatars">

            {(
              form.gender === 'nina'
                ? ['👧', '👸', '🧚', '🐰']
                : ['🧒', '🦁', '🦸', '🧑‍🚀']
            ).map(a => (

              <button
                type="button"
                key={a}
                className={
                  form.avatar === a
                    ? 'selected'
                    : ''
                }
                onClick={() =>
                  setForm({
                    ...form,
                    avatar: a
                  })
                }
              >
                {a}
              </button>

            ))}

          </div>


          {msg && (
            <div className="error">
              {msg}
            </div>
          )}


          <button
            type="submit"
            className="btn green"
          >
            Crear mi cuenta
          </button>

        </form>

      </div>
    );
  }


  /* =======================================================
     MENÚ
     ======================================================= */

  if (screen === 'menu') {

    return shell(

      <div className="center menu">

        <Logo />


        <div className="profile">

          <span>
            {current?.avatar}
          </span>


          <div>

            <b>
              ¡Hola, {current?.name}!
            </b>

            <small>
              {current?.age} años
            </small>

          </div>


          <strong>
            ⭐ {progress.stars}
          </strong>

        </div>


        <div className="menu-grid">

          <button
            type="button"
            onClick={() => go('games')}
          >
            🎮
            <b>Jugar</b>
          </button>


          <button
            type="button"
            onClick={() => go('puzzles')}
          >
            🧩
            <b>Rompecabezas</b>
          </button>


          <button
            type="button"
            onClick={() =>
              go('achievements')
            }
          >
            🏆
            <b>Mis logros</b>
          </button>


          <button
            type="button"
            onClick={() =>
              go('progress')
            }
          >
            📊
            <b>Mi progreso</b>
          </button>

        </div>


        <div className="menu-actions">

          <button
            type="button"
            className="logout-btn"
            onClick={() => {

              logout();

              setCurrent(null);

              stopMusic();

              go('home');

            }}
          >
            🚪 Cerrar sesión
          </button>

        </div>

      </div>
    );
  }


  /* =======================================================
     JUEGOS
     ======================================================= */

  if (screen === 'games') {

    return shell(

      <div className="center catalog">

        <button
          type="button"
          className="back"
          onClick={() => go('menu')}
        >
          ←
        </button>


        <h1>
          🎮 Elige un juego
        </h1>

        <p>
          Aprende jugando y gana estrellas
        </p>


        <div className="game-grid">

          <button
            type="button"
            onClick={() =>
              startGame('sum')
            }
          >
            <span>➕</span>
            <b>Sumas</b>
            <small>Junta cantidades</small>
          </button>


          <button
            type="button"
            onClick={() =>
              startGame('sub')
            }
          >
            <span>➖</span>
            <b>Restas</b>
            <small>Quita y descubre</small>
          </button>


          <button
            type="button"
            onClick={() =>
              startGame('count')
            }
          >
            <span>🍎</span>
            <b>Contar</b>
            <small>Cuenta los dibujos</small>
          </button>


          <button
            type="button"
            onClick={() =>
              startGame('seq')
            }
          >
            <span>🔢</span>
            <b>Series</b>
            <small>Completa la secuencia</small>
          </button>

        </div>

      </div>
    );
  }


  /* =======================================================
     ROMPECABEZAS
     ======================================================= */

  if (screen === 'puzzles') {

    return shell(

      <div className="center catalog">

        <button
          type="button"
          className="back"
          onClick={() => go('menu')}
        >
          ←
        </button>


        <h1>
          🧩 Elige tu rompecabezas
        </h1>

        <p>
          15 dibujos diferentes para jugar
        </p>


        <div className="puzzle-grid">

          {puzzleList(
            current?.gender
          ).map(x => (

            <button
              type="button"
              key={x.id}
              onClick={() => {

                setSelectedPuzzle(x);

                go('difficulty');

              }}
            >

              <span>
                {x.icon}
              </span>

              <b>
                {x.index + 1}. {x.name}
              </b>

            </button>

          ))}

        </div>

      </div>
    );
  }


  /* =======================================================
     DIFICULTAD
     ======================================================= */

  if (screen === 'difficulty') {

    return shell(

      <div className="center">

        <button
          type="button"
          className="back"
          onClick={() => go('puzzles')}
        >
          ←
        </button>


        <h1>
          {selectedPuzzle?.icon}{' '}
          {selectedPuzzle?.name}
        </h1>


        <h2>
          ¿Cuántas piezas quieres?
        </h2>


        <div className="difficulty">

          {difficulties.map(n => (

            <button
              type="button"
              key={n}
              onClick={async () => {

                try {
                  await unlockAudio();
                } catch (error) {
                  console.warn(error);
                }

                setDifficulty(n);

                setPuzzleKey(
                  key => key + 1
                );

                go('playPuzzle');

              }}
            >

              <b>
                {n}
              </b>

              <small>
                piezas
              </small>

            </button>

          ))}

        </div>


        <p className="pill">
          🦁 A mayor número de piezas, mayor desafío
        </p>

      </div>
    );
  }


  /* =======================================================
     JUGAR PUZZLE
     ======================================================= */

  if (screen === 'playPuzzle') {

    return (

      <PuzzleGame
        key={puzzleKey}
        puzzle={selectedPuzzle}
        gender={current.gender}
        count={difficulty}
        onBack={() =>
          go('difficulty')
        }
        onComplete={completePuzzle}
      />
    );
  }


  /* =======================================================
     COMPLETADO
     ======================================================= */

  if (screen === 'complete') {

    return shell(

      <div className="center">

        <div className="celebrate">
          🎉
        </div>


        <h1>
          ¡COMPLETADO!
        </h1>


        <h2>
          {selectedPuzzle?.name}
        </h2>


        <div className="stars-big">
          ⭐⭐⭐
        </div>


        <p className="pill">
          Ganaste +3 estrellas
        </p>


        <div className="actions">

          <button
            type="button"
            className="btn green"
            onClick={() =>
              go('puzzles')
            }
          >
            ▶️ Siguiente rompecabezas
          </button>


          <button
            type="button"
            className="btn blue"
            onClick={() =>
              go('menu')
            }
          >
            🏠 Volver al menú
          </button>

        </div>

      </div>
    );
  }


  /* =======================================================
     MATEMÁTICAS
     ======================================================= */

  if (screen === 'math') {

    const title = {
      sum: '➕ Sumas divertidas',
      sub: '➖ Restas divertidas',
      count:
        `${math.item.icon} Cuenta los ${math.item.many}`,
      seq: '🔢 Completa la serie'
    }[gameType];


    let q;


    if (math.op === 'count') {

      q = (

        <div className="object-cloud">

          {Array.from(
            { length: math.a },
            (_, i) => (
              <span key={i}>
                {math.item.icon}
              </span>
            )
          )}

        </div>
      );

    } else if (math.op === 'seq') {

      q = (

        <div className="series-row numeric-series">

          <span>
            {math.a}
          </span>

          <b>→</b>

          <span>
            {math.a + math.b}
          </span>

          <b>→</b>

          <span className="question-bubble">
            ?
          </span>

        </div>
      );

    } else {

      q = (

        <div className="visual-operation">

          <span>
            {math.item.icon.repeat(math.a)}
          </span>

          <b>
            {math.op}
          </b>

          <span>
            {math.item.icon.repeat(math.b)}
          </span>

          <b>
            = ?
          </b>

        </div>
      );
    }


    return shell(

      <div className="center">

        <button
          type="button"
          className="back"
          onClick={() => go('games')}
        >
          ←
        </button>


        <h1>
          {title}
        </h1>


        <div className="math-card">

          <div className="math-question">
            {q}
          </div>


          <input
            className="math-answer"
            disabled={math.locked}
            inputMode="numeric"
            placeholder="?"
            value={math.answer}
            onChange={e =>
              !math.locked &&
              setMath({
                ...math,
                answer: e.target.value,
                feedback: ''
              })
            }
          />


          {math.feedback === 'correct' && (

            <p className="good">
              ⭐ ¡CORRECTO! +1 estrella
            </p>

          )}


          {math.feedback === 'wrong' && (

            <p className="bad">
              💪 ¡Inténtalo otra vez!
            </p>

          )}


          {!math.locked && (

            <button
              type="button"
              className="btn green"
              onClick={checkMath}
            >
              ✓ Comprobar
            </button>

          )}


          {math.locked && (

            <button
              type="button"
              className="btn blue next-challenge"
              onClick={newMath}
            >
              ▶️ Siguiente reto
            </button>

          )}

        </div>

      </div>
    );
  }


  /* =======================================================
     LOGROS
     ======================================================= */

  if (screen === 'achievements') {

    return shell(

      <div className="center catalog">

        <button
          type="button"
          className="back"
          onClick={() => go('menu')}
        >
          ←
        </button>


        <h1>
          🏆 Mis logros
        </h1>


        <div className="achievement-grid">

          <div
            className={
              progress.mathCorrect >= 1
                ? 'earned'
                : ''
            }
          >
            🌟
            <b>Primer acierto</b>
            <small>
              Resuelve 1 reto matemático
            </small>
          </div>


          <div
            className={
              progress.mathCorrect >= 10
                ? 'earned'
                : ''
            }
          >
            🧠
            <b>Mente brillante</b>
            <small>
              10 retos matemáticos
            </small>
          </div>


          <div
            className={
              progress.completed.length >= 1
                ? 'earned'
                : ''
            }
          >
            🧩
            <b>Primer puzzle</b>
            <small>
              Completa 1 rompecabezas
            </small>
          </div>


          <div
            className={
              progress.completed.length >= 5
                ? 'earned'
                : ''
            }
          >
            🏅
            <b>Maestro puzzle</b>
            <small>
              Completa 5 rompecabezas
            </small>
          </div>


          <div
            className={
              progress.stars >= 20
                ? 'earned'
                : ''
            }
          >
            ⭐
            <b>Coleccionista</b>
            <small>
              Consigue 20 estrellas
            </small>
          </div>


          <div
            className={
              progress.stars >= 50
                ? 'earned'
                : ''
            }
          >
            👑
            <b>Campeón JUMATI</b>
            <small>
              Consigue 50 estrellas
            </small>
          </div>

        </div>

      </div>
    );
  }


  /* =======================================================
     PROGRESO
     ======================================================= */

  if (screen === 'progress') {

    const mathPct =
      Math.min(
        100,
        progress.mathCorrect * 5
      );

    const puzPct =
      Math.min(
        100,
        Math.round(
          progress.completed.length /
          15 *
          100
        )
      );


    return shell(

      <div className="center catalog">

        <button
          type="button"
          className="back"
          onClick={() => go('menu')}
        >
          ←
        </button>


        <h1>
          📊 Mi progreso
        </h1>


        <div className="stats">

          <div>
            <b>
              ⭐ {progress.stars}
            </b>
            <small>
              Estrellas
            </small>
          </div>


          <div>
            <b>
              🧩 {progress.completed.length}
            </b>
            <small>
              Rompecabezas
            </small>
          </div>


          <div>
            <b>
              🎮 {progress.mathCorrect}
            </b>
            <small>
              Retos correctos
            </small>
          </div>

        </div>


        <div className="progress-card">

          <b>
            🎮 Juegos matemáticos
          </b>


          <div className="progress-bar">
            <i
              style={{
                width: `${mathPct}%`
              }}
            />
          </div>

          <small>
            {mathPct}%
          </small>


          <b>
            🧩 Rompecabezas
          </b>


          <div className="progress-bar">
            <i
              style={{
                width: `${puzPct}%`
              }}
            />
          </div>

          <small>
            {puzPct}%
          </small>

        </div>

      </div>
    );
  }


  return null;
}


/* =========================================================
   PUZZLE GAME
   ========================================================= */

function PuzzleGame({
  puzzle,
  gender,
  count,
  onBack,
  onComplete
}) {

  useEffect(() => {

    try {

      startMusic(
        (puzzle?.index || 0) +
        (gender === 'nina' ? 4 : 0)
      );

    } catch (error) {
      console.warn(error);
    }


    const voiceTimer =
      setTimeout(() => {

        try {

          speakPuzzleInstruction(
            gender
          );

        } catch (error) {
          console.warn(error);
        }

      }, 250);


    return () => {

      clearTimeout(
        voiceTimer
      );

      stopMusic();

      try {
        window.speechSynthesis?.cancel();
      } catch (error) {
        console.warn(error);
      }

    };

  }, [puzzle, gender]);


  const [cols, rows] =
    gridFor[count];

  const total =
    cols * rows;


  const image =
    useMemo(
      () =>
        puzzleSvgData(
          puzzle,
          gender
        ),
      [puzzle, gender]
    );


  const [placed, setPlaced] =
    useState(
      () =>
        Array(total).fill(false)
    );


  const [pieces, setPieces] =
    useState(
      () =>
        shuffle(
          Array.from(
            { length: total },
            (_, i) => i
          )
        )
    );


  const [selected, setSelected] =
    useState(null);

  const [done, setDone] =
    useState(false);

  const [guideTarget, setGuideTarget] =
    useState(null);

  const [dragging, setDragging] =
    useState(null);


  /* =======================================================
     COLOCAR PIEZA
     ======================================================= */

  const place = (
    piece,
    target
  ) => {

    if (done) {
      return;
    }


    if (piece !== target) {

      wrongSound();

      setGuideTarget(piece);

      return;
    }


    pieceSound();


    setPlaced(previous => {

      const next =
        [...previous];

      next[target] = true;


      if (next.every(Boolean)) {

        setDone(true);

        winSound();

        speakPuzzleComplete(
          gender
        );

        setTimeout(
          onComplete,
          2100
        );
      }


      return next;
    });


    setPieces(previous =>
      previous.filter(
        value =>
          value !== piece
      )
    );


    setSelected(null);

    setGuideTarget(null);
  };


  /* =======================================================
     DRAG DE ESCRITORIO
     ======================================================= */

  const dragStart = (
    event,
    i
  ) => {

    setSelected(i);

    setGuideTarget(i);


    event.dataTransfer.setData(
      'text/plain',
      String(i)
    );


    event.dataTransfer.effectAllowed =
      'move';
  };


  const drop = (
    event,
    target
  ) => {

    event.preventDefault();


    const piece =
      Number(
        event.dataTransfer.getData(
          'text/plain'
        )
      );


    place(
      piece,
      target
    );
  };


  /* =======================================================
     ARRASTRAR CON DEDO
     ======================================================= */

  const pointerDown = (
    event,
    piece
  ) => {

    if (
      event.pointerType === 'mouse' &&
      event.button !== 0
    ) {
      return;
    }


    try {

      event.currentTarget.setPointerCapture(
        event.pointerId
      );

    } catch (error) {
      // Safari puede gestionar el pointer sin capture.
    }


    setSelected(piece);

    setGuideTarget(piece);


    setDragging({
      piece,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    });
  };


  const pointerMove = event => {

    if (!dragging) {
      return;
    }


    const distanceX =
      Math.abs(
        event.clientX -
        dragging.startX
      );


    const distanceY =
      Math.abs(
        event.clientY -
        dragging.startY
      );


    const moved =
      dragging.moved ||
      distanceX > 6 ||
      distanceY > 6;


    setDragging(previous => {

      if (!previous) {
        return null;
      }


      return {
        ...previous,
        x: event.clientX,
        y: event.clientY,
        moved
      };
    });


    const element =
      document.elementFromPoint(
        event.clientX,
        event.clientY
      );


    const slot =
      element?.closest?.(
        '[data-puzzle-slot]'
      );


    if (slot) {

      const target =
        Number(
          slot.dataset.puzzleSlot
        );


      if (
        target ===
        dragging.piece
      ) {

        setGuideTarget(
          target
        );
      }

    } else {

      setGuideTarget(
        dragging.piece
      );
    }
  };


  const pointerUp = async event => {

    if (!dragging) {
      return;
    }


    const {
      piece,
      moved
    } = dragging;


    const element =
      document.elementFromPoint(
        event.clientX,
        event.clientY
      );


    const slot =
      element?.closest?.(
        '[data-puzzle-slot]'
      );


    if (
      moved &&
      slot
    ) {

      const target =
        Number(
          slot.dataset.puzzleSlot
        );


      place(
        piece,
        target
      );

    } else if (moved) {

      /*
        La soltó fuera del tablero.
        La pieza vuelve a la bandeja.
      */

      wrongSound();

      setGuideTarget(
        piece
      );

    } else {

      /*
        No la arrastró:
        conservamos el modo tocar + tocar.
      */

      setSelected(
        piece
      );

      setGuideTarget(
        piece
      );


      try {

        await unlockAudio();


        speak(
          '¡Muy bien! Coloca la pieza donde está brillando.',
          gender,
          {
            rate: 1.05
          }
        );

      } catch (error) {
        console.warn(error);
      }


      setTimeout(() => {

        setGuideTarget(
          target =>
            target === piece
              ? null
              : target
        );

      }, 2600);
    }


    setDragging(null);


    try {

      event.currentTarget.releasePointerCapture(
        event.pointerId
      );

    } catch (error) {
      // No bloquear el juego.
    }
  };


  const pointerCancel = () => {

    setDragging(null);

    setGuideTarget(null);
  };


  /* =======================================================
     RESET
     ======================================================= */

  const reset = async () => {

    setPlaced(
      Array(total).fill(false)
    );


    setPieces(
      shuffle(
        Array.from(
          { length: total },
          (_, i) => i
        )
      )
    );


    setSelected(null);

    setGuideTarget(null);

    setDragging(null);

    setDone(false);


    try {

      await unlockAudio();

      speakPuzzleInstruction(
        gender
      );

    } catch (error) {
      console.warn(error);
    }
  };


  /* =======================================================
     RENDER PUZZLE
     ======================================================= */

  return (

    <main className="app">

      <section className="screen puzzle-screen">

        <button
          type="button"
          className="back"
          onClick={onBack}
        >
          ←
        </button>


        <div className="puzzle-page">

          <div className="puzzle-head">

            <div>

              <b>
                {puzzle.icon}{' '}
                {puzzle.name}
              </b>

              <small>
                {count} piezas
              </small>

            </div>


            <strong>
              🧩 {placed.filter(Boolean).length}/{total}
            </strong>

          </div>


          <div className="puzzle-layout">

            {/* TABLERO */}

            <div
              className="board"
              style={{
                gridTemplateColumns:
                  `repeat(${cols},1fr)`,

                gridTemplateRows:
                  `repeat(${rows},1fr)`,

                aspectRatio:
                  '10 / 7'
              }}
            >

              {Array.from(
                { length: total },
                (_, i) => (

                  <div
                    key={i}

                    data-puzzle-slot={i}

                    className={
                      `slot ` +
                      `${placed[i] ? 'filled' : ''} ` +
                      `${guideTarget === i ? 'guide-target' : ''}`
                    }

                    onDragOver={e =>
                      e.preventDefault()
                    }

                    onDrop={e =>
                      drop(
                        e,
                        i
                      )
                    }

                    onClick={() => {

                      if (
                        selected !== null &&
                        !dragging
                      ) {

                        place(
                          selected,
                          i
                        );
                      }

                    }}
                  >

                    {placed[i]
                      ? (
                        <Piece
                          i={i}
                          cols={cols}
                          rows={rows}
                          image={image}
                        />
                      )
                      : (
                        <Piece
                          i={i}
                          cols={cols}
                          rows={rows}
                          image={image}
                          guide
                        />
                      )
                    }

                  </div>

                )
              )}

            </div>


            {/* BANDEJA */}

            <div className="tray">

              <div className="puzzle-tools">

                <button
                  type="button"
                  className="reset-only"
                  onClick={reset}
                >
                  🔄 Reiniciar
                </button>

              </div>


              <div className="pieces">

                {pieces.map(i => (

                  <div
                    key={i}

                    draggable={
                      !dragging
                    }

                    onDragStart={e =>
                      dragStart(
                        e,
                        i
                      )
                    }

                    onPointerDown={e =>
                      pointerDown(
                        e,
                        i
                      )
                    }

                    onPointerMove={
                      pointerMove
                    }

                    onPointerUp={
                      pointerUp
                    }

                    onPointerCancel={
                      pointerCancel
                    }

                    className={
                      `piece-wrap ` +
                      `${selected === i ? 'selected-piece' : ''} ` +
                      `${dragging?.piece === i ? 'touch-dragging' : ''}`
                    }
                  >

                    <Piece
                      i={i}
                      cols={cols}
                      rows={rows}
                      image={image}
                    />

                  </div>

                ))}

              </div>


              <p className="touch-help">
                👆 Toca una pieza para ver dónde va
                o arrástrala con el dedo hasta el tablero.
              </p>

            </div>

          </div>

        </div>


        {/* PIEZA FLOTANTE PARA CELULAR */}

        {dragging?.moved && (

          <div
            className="touch-drag-preview"
            style={{
              left:
                `${dragging.x}px`,
              top:
                `${dragging.y}px`
            }}
          >

            <Piece
              i={dragging.piece}
              cols={cols}
              rows={rows}
              image={image}
            />

          </div>

        )}

      </section>

    </main>
  );
}


/* =========================================================
   PIEZA
   ========================================================= */

function Piece({
  i,
  cols,
  rows,
  image,
  guide = false
}) {

  const x =
    i % cols;

  const y =
    Math.floor(
      i / cols
    );


  return (

    <div
      className={
        `piece ${guide ? 'guide-piece' : ''}`
      }

      style={{

        backgroundImage:
          `url("${image}")`,

        backgroundSize:
          `${cols * 100}% ${rows * 100}%`,

        backgroundPosition:
          `${
            cols === 1
              ? 0
              : (x / (cols - 1)) * 100
          }% ${
            rows === 1
              ? 0
              : (y / (rows - 1)) * 100
          }%`

      }}
    />
  );
}


/* =========================================================
   EXPORT
   ========================================================= */

export default App;