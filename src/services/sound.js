let ctx = null;
let master = null;
let timer = null;
let enabled = true;
let musicGain = null;

/* =========================================================
   AUDIO SEGURO PARA PC / ANDROID / IPHONE / IPAD
   ========================================================= */

const ensure = () => {
  if (!enabled) return null;

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!ctx) {
      ctx = new AudioContextClass();

      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.gain.value = 0.14;
      musicGain.connect(master);
    }

    if (ctx.state === "suspended") {
      const promise = ctx.resume();

      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    }

    return ctx;
  } catch (error) {
    console.warn("Audio no disponible:", error);
    return null;
  }
};

/* =========================================================
   ACTIVAR / DESACTIVAR AUDIO
   ========================================================= */

export const setSoundEnabled = (value) => {
  enabled = value;

  if (!value) {
    stopMusic();

    try {
      window.speechSynthesis?.cancel();
    } catch (error) {
      console.warn("No se pudo detener la voz:", error);
    }
  }
};

export const isSoundEnabled = () => enabled;

/* =========================================================
   TONOS
   ========================================================= */

const tone = (
  freq,
  dur = 0.16,
  type = "sine",
  vol = 1,
  when = 0,
  target = "fx"
) => {
  if (!enabled) return;

  try {
    const c = ensure();

    if (!c || !master) return;

    const oscillator = c.createOscillator();
    const gain = c.createGain();

    oscillator.type = type;
    oscillator.frequency.value = freq;

    gain.gain.setValueAtTime(
      0.0001,
      c.currentTime + when
    );

    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, 0.18 * vol),
      c.currentTime + when + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      c.currentTime + when + dur
    );

    oscillator.connect(gain);

    if (target === "music" && musicGain) {
      gain.connect(musicGain);
    } else {
      gain.connect(master);
    }

    oscillator.start(c.currentTime + when);
    oscillator.stop(c.currentTime + when + dur + 0.03);

  } catch (error) {
    console.warn("No se pudo reproducir sonido:", error);
  }
};

/* =========================================================
   EFECTOS
   ========================================================= */

export const clickSound = () => {
  try {
    tone(660, 0.08, "sine", 0.35);
  } catch (error) {
    console.warn("Click sin sonido:", error);
  }
};

export const correctSound = () => {
  try {
    tone(523, 0.12, "triangle", 0.65);
    tone(659, 0.12, "triangle", 0.65, 0.1);
    tone(784, 0.2, "triangle", 0.75, 0.2);
  } catch (error) {
    console.warn(error);
  }
};

export const wrongSound = () => {
  try {
    tone(240, 0.12, "sine", 0.25);
    tone(190, 0.18, "sine", 0.2, 0.12);
  } catch (error) {
    console.warn(error);
  }
};

export const pieceSound = () => {
  try {
    tone(740, 0.07, "sine", 0.3);
    tone(880, 0.09, "sine", 0.28, 0.06);
  } catch (error) {
    console.warn(error);
  }
};

export const winSound = () => {
  try {
    [523, 659, 784, 1047].forEach((note, index) => {
      tone(
        note,
        0.25,
        "triangle",
        0.7,
        index * 0.13
      );
    });
  } catch (error) {
    console.warn(error);
  }
};

/* =========================================================
   MÚSICA
   ========================================================= */

const themes = [
  [261.6, 329.6, 392, 329.6, 440, 392, 329.6, 293.7],
  [293.7, 349.2, 440, 349.2, 493.9, 440, 349.2, 329.6],
  [329.6, 392, 493.9, 440, 392, 329.6, 293.7, 329.6],
  [261.6, 392, 349.2, 329.6, 293.7, 329.6, 392, 523.3],
  [392, 440, 523.3, 440, 587.3, 523.3, 440, 392],
  [349.2, 440, 523.3, 493.9, 440, 392, 349.2, 392],
  [440, 523.3, 659.3, 587.3, 523.3, 493.9, 440, 523.3],
  [392, 493.9, 587.3, 523.3, 493.9, 440, 392, 349.2]
];

export const startMusic = (theme = 0) => {
  stopMusic();

  if (!enabled) return;

  try {
    const c = ensure();

    if (!c) return;

    const notes =
      themes[Math.abs(theme) % themes.length];

    let i = 0;

    const play = () => {
      try {
        tone(
          notes[i % notes.length],
          0.34,
          "sine",
          0.34,
          0,
          "music"
        );

        if (i % 4 === 0) {
          tone(
            notes[i % notes.length] / 2,
            0.46,
            "triangle",
            0.13,
            0,
            "music"
          );
        }

        i++;
      } catch (error) {
        console.warn(error);
      }
    };

    play();

    timer = setInterval(play, 430);

  } catch (error) {
    console.warn("Música no disponible:", error);
  }
};

export const stopMusic = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

/* =========================================================
   VOCES
   ========================================================= */

const femaleHints = [
  "female",
  "mujer",
  "monica",
  "paulina",
  "sabina",
  "helena",
  "elvira",
  "dalia",
  "sofia",
  "luciana",
  "maria"
];

const maleHints = [
  "male",
  "hombre",
  "jorge",
  "pablo",
  "diego",
  "raul",
  "carlos",
  "alvaro",
  "andres",
  "mateo"
];

function chooseVoice(gender) {
  try {
    if (!("speechSynthesis" in window)) {
      return null;
    }

    const voices =
      window.speechSynthesis.getVoices?.() || [];

    const spanish = voices.filter(
      voice => /^es/i.test(voice.lang)
    );

    const pool =
      spanish.length ? spanish : voices;

    const hints =
      gender === "nina"
        ? femaleHints
        : maleHints;

    return (
      pool.find(voice =>
        hints.some(hint =>
          voice.name
            .toLowerCase()
            .includes(hint)
        )
      ) ||
      pool[gender === "nina" ? 1 : 0] ||
      pool[0] ||
      null
    );

  } catch (error) {
    console.warn("Voz no disponible:", error);
    return null;
  }
}

/* =========================================================
   HABLAR
   ========================================================= */

export function speak(
  text,
  gender = "nino",
  { rate = 1.02, pitch } = {}
) {
  if (!enabled) return;

  try {
    if (!("speechSynthesis" in window)) {
      return;
    }

    /*
      El audio de voz no debe bloquear
      el funcionamiento de JUMATI.
    */

    const c = ensure();

    if (c && musicGain) {
      try {
        musicGain.gain.setTargetAtTime(
          0.035,
          c.currentTime,
          0.05
        );
      } catch (error) {}
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = "es-PE";
    utterance.rate = rate;

    utterance.pitch =
      pitch ??
      (gender === "nina" ? 1.12 : 0.96);

    utterance.volume = 1;

    const voice = chooseVoice(gender);

    if (voice) {
      utterance.voice = voice;
    }

    const restoreMusic = () => {
      try {
        if (ctx && musicGain) {
          musicGain.gain.setTargetAtTime(
            0.14,
            ctx.currentTime,
            0.15
          );
        }
      } catch (error) {}
    };

    utterance.onend = restoreMusic;
    utterance.onerror = restoreMusic;

    window.speechSynthesis.speak(utterance);

  } catch (error) {
    /*
      MUY IMPORTANTE:
      Si Safari no permite voz/audio,
      la aplicación continúa funcionando.
    */
    console.warn(
      "Síntesis de voz no disponible:",
      error
    );
  }
}

/* =========================================================
   MENSAJES
   ========================================================= */

export const speakCorrect = gender =>
  speak(
    [
      "¡Sí! ¡Muy bien!",
      "¡Excelente! ¡Lo hiciste genial!",
      "¡Súper! ¡Respuesta correcta!"
    ][Math.floor(Math.random() * 3)],
    gender,
    { rate: 1.08 }
  );

export const speakWrong = gender =>
  speak(
    "¡Casi! Inténtalo otra vez. ¡Tú puedes!",
    gender,
    { rate: 1.05 }
  );

export const speakPuzzleComplete = gender =>
  speak(
    "¡Rompecabezas completado! ¡Lo lograste! ¡Muy bien!",
    gender,
    { rate: 1.04 }
  );

/* =========================================================
   GRAMÁTICA
   ========================================================= */

const words = [
  "cero",
  "una",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte"
];

const num = n =>
  words[n] ?? String(n);

const quantified = (item, n) => {
  if (n === 1) {
    return `${
      item.gender === "f" ? "una" : "un"
    } ${item.one}`;
  }

  return `${num(n)} ${item.many}`;
};

/* =========================================================
   INSTRUCCIONES MATEMÁTICAS
   ========================================================= */

export const speakMathInstruction = (
  type,
  gender,
  a,
  b,
  item = {
    one: "dibujo",
    many: "dibujos",
    gender: "m"
  }
) => {
  let text;

  if (type === "sum") {
    text =
      `Tenemos ${quantified(item, a)}, ` +
      `más ${quantified(item, b)}. ` +
      `¿Cuántos ${item.many} tenemos en total?`;
  }

  else if (type === "sub") {
    text =
      `Tenemos ${quantified(item, a)}. ` +
      `Quitamos ${quantified(item, b)}. ` +
      `¿Cuántos ${item.many} quedan?`;
  }

  else if (type === "count") {
    text =
      `¿Cuántos ${item.many} hay? ` +
      `Cuenta con atención.`;
  }

  else {
    text =
      `Mira los números. ` +
      `${num(a)}, ${num(a + b)}. ` +
      `¿Qué número sigue?`;
  }

  speak(
    text,
    gender,
    { rate: 1.04 }
  );
};

/* =========================================================
   ROMPECABEZAS
   ========================================================= */

export const speakPuzzleInstruction = gender =>
  speak(
    "¡Vamos a armar el dibujo! " +
    "Toca una pieza y JUMATI iluminará " +
    "automáticamente el lugar donde va.",
    gender,
    { rate: 1.03 }
  );