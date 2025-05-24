let fraseOriginal = "";
let letrasOcultas = [];
let letrasReveladas = [];
let maxErrores = 0;
let errores = 0;

// Mapeo de identificador -> letra
let mapaIdentificadorLetra = {};
let mapaLetraIdentificador = {};

function iniciarJuego() {
  const idioma = document.getElementById("idioma").value;
  const dificultad = document.getElementById("dificultad").value;

  Papa.parse("frases.csv", {
    download: true,
    header: true,
    complete: function(results) {
      const frases = results.data.filter(f => f.idioma === idioma && f.dificultad === dificultad);
      if (frases.length === 0) {
        alert("No hay frases disponibles para esta combinación.");
        return;
      }

      // Seleccionar frase aleatoria
      fraseOriginal = frases[Math.floor(Math.random() * frases.length)].frase.toLowerCase();
      letrasOcultas = fraseOriginal.split("");
      letrasReveladas = Array(letrasOcultas.length).fill(false);

      // Configurar identificadores únicos por letra
      asignarIdentificadores();

      // Mostrar interfaz
      mostrarFraseConInputs();
      generarPanelAutocompletar(idioma);

      // Establecer límites de errores
      switch(dificultad) {
        case "facil": maxErrores = 5; break;
        case "medio": maxErrores = 4; break;
        case "dificil": maxErrores = 3; break;
      }
      errores = 0;
      actualizarContador();

      // Ocultar menú y mostrar juego
      document.getElementById("menu").classList.add("oculto");
      document.getElementById("juego").classList.remove("oculto");
    }
  });
}

function asignarIdentificadores() {
  let identificador = 1;
  mapaIdentificadorLetra = {};
  mapaLetraIdentificador = {};

  // Asignar identificadores únicos a cada letra
  for (let i = 0; i < letrasOcultas.length; i++) {
    let char = letrasOcultas[i];

    if (!/[a-zñáéíóúü]/i.test(char)) continue;

    if (!mapaLetraIdentificador[char]) {
      mapaLetraIdentificador[char] = identificador;
      mapaIdentificadorLetra[identificador] = char;
      identificador++;
    }
  }
}

function mostrarFraseConInputs() {
  const contenedor = document.getElementById("letra-contenedor");
  contenedor.innerHTML = "";

  for (let i = 0; i < letrasOcultas.length; i++) {
    let char = letrasOcultas[i];

    // Crear una columna para cada letra e identificador
    const col = document.createElement("div");
    col.classList.add("col-auto"); // Usamos col-auto para ajustar el ancho automáticamente

    if (char === " ") {
      // Espacio en blanco
      col.innerHTML = "&nbsp;&nbsp;";
    } else if (/[^a-zñáéíóúü]/i.test(char)) {
      // Caracteres especiales (no letras)
      col.innerHTML = 
      
      `
        <div class="col-auto">
            &nbsp;
        </div>
        <div class="col-auto">
            <span>
            ${char}
            </span>
        </div>
      `;
    } else {
      // Input para letras
      let input = document.createElement("input");
      input.type = "text";
      input.maxLength = 1;
      input.dataset.indice = i;
      input.classList.add("letra-input");

      if (letrasReveladas[i]) {
        input.value = char;
        input.readOnly = true;
      } else {
        input.addEventListener("input", () => validarYGuardar(input));
      }

      col.appendChild(input);

      // Identificador numérico debajo del input
      const id = mapaLetraIdentificador[char];
      const identificadorSpan = document.createElement("span");
      identificadorSpan.textContent = id || "?";
      identificadorSpan.classList.add("identificador");
      col.appendChild(identificadorSpan);
    }

    // Agregar la columna al contenedor
    contenedor.appendChild(col);
  }
}

function generarPanelAutocompletar(idioma) {
  const contenedor = document.getElementById("autocompletar");
  contenedor.innerHTML = "<strong>Autocompletar:</strong><br>";

  let letrasDisponibles = idioma === "español"
    ? "abcdefghijklmnopqrstuvwxyzñáéíóúü"
    : "abcdefghijklmnopqrstuvwxyz";

  letrasDisponibles.split("").forEach(letra => {
    let span = document.createElement("span");
    span.textContent = letra;
    span.dataset.letra = letra;

    span.addEventListener("click", () => autocompletarLetra(span));

    contenedor.appendChild(span);
  });
}

function autocompletarLetra(elemento) {
  const letra = elemento.dataset.letra.toLowerCase();
  const indiceLetras = [];

  // Buscar si hay alguna letra ya descubierta
  let tieneAlgunaDescubierta = false;
  for (let i = 0; i < letrasOcultas.length; i++) {
    if (letrasOcultas[i] === letra && !letrasReveladas[i]) {
      indiceLetras.push(i);
    }
    if (letrasReveladas[i] && letrasOcultas[i] === letra) {
      tieneAlgunaDescubierta = true;
    }
  }

  if (!tieneAlgunaDescubierta) return;

  // Completar todas las instancias de la letra
  indiceLetras.forEach(i => {
    if (!letrasReveladas[i]) {
      letrasReveladas[i] = true;
      const inputs = document.querySelectorAll(`input[data-indice='${i}']`);
      inputs.forEach(input => {
        input.value = letrasOcultas[i];
        input.readOnly = true;
      });
    }
  });

  // Actualizar visualización
  actualizarPanelAutocompletar();
  verificarVictoria();
}

function validarYGuardar(input) {
  const indice = parseInt(input.dataset.indice);
  const valor = input.value.toLowerCase();

  const idioma = document.getElementById("idioma").value;
  const regex = idioma === "español"
    ? /^[a-zñáéíóúü]$/
    : /^[a-z]$/;

  if (!regex.test(valor)) {
    input.value = "";
    return;
  }

  if (valor === letrasOcultas[indice]) {
    letrasReveladas[indice] = true;
    input.readOnly = true;
    input.style.backgroundColor = "#2c2c2c"; // Cambiar color al completar
    input.style.color = "green";

    // Actualizar panel de autocompletado
    actualizarPanelAutocompletar();
    verificarVictoria();
  } else {
    errores++;
    input.style.borderColor = "red"; // Resaltar error
    setTimeout(() => {
      input.style.borderColor = "white"; // Quitar resalto después de 500ms
    }, 500);

    actualizarContador();
    if (errores >= maxErrores) {
      setTimeout(() => {
        alert("¡Has perdido!");
        reiniciarJuego();
      }, 500);
    }
  }
}

function actualizarPanelAutocompletar() {
  document.querySelectorAll("#autocompletar span").forEach(span => {
    const letra = span.dataset.letra;
    const totalEnFrase = letrasOcultas.filter(c => c === letra).length;
    const totalReveladas = letrasReveladas.filter((r, i) => r && letrasOcultas[i] === letra).length;

    if (totalReveladas === 0) {
      span.className = "disponible";
    } else if (totalReveladas === totalEnFrase) {
      span.className = "revelado";
    } else {
      span.className = "parpardear";
    }
  });
}

function verificarVictoria() {
  if (letrasReveladas.every(Boolean)) {
    setTimeout(() => {
      alert("¡Felicidades! Has descubierto toda la frase.");
      reiniciarJuego();
    }, 500);
  }
}

function actualizarContador() {
  document.getElementById("errores").textContent = `${errores}/${maxErrores} errores`;
}

function reiniciarJuego() {
  document.getElementById("juego").classList.add("oculto");
  document.getElementById("menu").classList.remove("oculto");
}