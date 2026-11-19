const tg = window.Telegram.WebApp;
tg.expand();

const formatMoneda = (num) => num.toLocaleString('es-CO');

const catalogo = [
    { id: "g12", nombre: "Granizado 12oz", precio: 12000 },
    { id: "g14", nombre: "Granizado 14oz", precio: 14000 },
    { id: "g16", nombre: "Granizado 16oz", precio: 15000 },
    { id: "m20", nombre: "Mexicano Spicy", precio: 20000 },
    { id: "a20", nombre: "Americano", precio: 20000 },
    { id: "si", nombre: "Soda Italiana", precio: 10000 },
    { id: "c3l", nombre: "Cava 3lt", precio: 100000 }
];

const opcionesSabores = [
    { id: "t1", nombre: "Mandarina", tipo: "Sin Licor", grad: "0%", bgClass: "bg-mandarina" },
    { id: "t2", nombre: "Frutos Morados", tipo: "(Tequila, Vodka, Ron)", grad: "12%", bgClass: "bg-frutosMorados" },
    { id: "t3", nombre: "Maracuyá", tipo: "Vodka", grad: "12%", bgClass: "bg-maracuya" }
];

const extrasDisp = [
    { id: "ex1", nombre: "Chamoy y Tajín", precio: 2000 },
    { id: "ex2", nombre: "Dulce fresa y Nerds", precio: 2000 },
    { id: "ex3", nombre: "2 shots Vodka", precio: 5000 },
    { id: "ex4", nombre: "2 shots Ron Blanco", precio: 5000 },
    { id: "ex5", nombre: "2 shots Smirnoff Tamarindo", precio: 5000 }
];

let carrito = [];
let prodActual = null;
let saborActual = null;
let indexEdicion = null; // Controla si estamos creando o editando

document.addEventListener("DOMContentLoaded", () => {
    renderizarCatalogo();
    tg.MainButton.onClick(enviarComanda);
});

function cambiarVista(idVista) {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.getElementById(idVista).classList.add('activa');
    if(idVista === 'vista-carrito') renderizarCarrito();
    actualizarBotonTelegram();
}

function volverCatalogo() {
    prodActual = null;
    indexEdicion = null;
    document.getElementById("btn-agregar-text").innerText = "Agregar a la orden";
    cambiarVista('vista-catalogo');
}

function formatearMiles(input) {
    let valorStr = input.value.replace(/\D/g, '');
    if (valorStr === '') { input.value = ''; return; }
    let num = parseInt(valorStr, 10);
    if (num > 10000) num = 10000;
    input.value = num.toLocaleString('es-CO');
}

function renderizarCatalogo() {
    const grid = document.getElementById("grid-productos");
    grid.innerHTML = "";
    catalogo.forEach(prod => {
        const div = document.createElement("div");
        div.className = "card-producto";
        div.innerHTML = `<div class="nombre">${prod.nombre}</div><div class="precio">$${formatMoneda(prod.precio)}</div>`;
        div.onclick = () => inicializarConstructor(prod);
        grid.appendChild(div);
    });
}

function inicializarConstructor(producto) {
    prodActual = producto;
    saborActual = null;
    indexEdicion = null;
    
    document.getElementById("titulo-producto").innerText = producto.nombre;
    document.getElementById("precio-base-display").innerText = `$${formatMoneda(producto.precio)}`;
    document.getElementById("notas-input").value = "";
    document.getElementById("btn-agregar-text").innerText = "Agregar a la orden";
    
    renderizarSabores(opcionesSabores[0].id); // Por defecto selecciona el primero
    renderizarAdicionales([]);
    recalcularConstructor();
    cambiarVista('vista-constructor');
}

function editarItem(index) {
    indexEdicion = index;
    const item = carrito[index];
    prodActual = item.producto;
    saborActual = item.sabor;

    document.getElementById("titulo-producto").innerText = prodActual.nombre;
    document.getElementById("precio-base-display").innerText = `$${formatMoneda(prodActual.precio)}`;
    document.getElementById("notas-input").value = item.notas || "";
    document.getElementById("btn-agregar-text").innerText = "Guardar Cambios";

    renderizarSabores(saborActual.id);
    const nombresAdicionalesGuardados = item.adicionales.map(a => a.nombre);
    renderizarAdicionales(nombresAdicionalesGuardados);
    recalcularConstructor();
    cambiarVista('vista-constructor');
}

function renderizarSabores(idSeleccionado) {
    const gridSabores = document.getElementById("grid-sabores");
    gridSabores.innerHTML = "";
    opcionesSabores.forEach(sabor => {
        const div = document.createElement("div");
        const isSelected = sabor.id === idSeleccionado;
        div.className = `card-sabor ${sabor.bgClass} ${isSelected ? 'seleccionado' : ''}`;
        if (isSelected) saborActual = sabor;
        div.innerHTML = `
            <span class="sabor-nombre">${sabor.nombre}</span>
            <span class="sabor-tag">${sabor.tipo} ${sabor.grad}</span>
        `;
        div.onclick = () => {
            document.querySelectorAll('.card-sabor').forEach(el => el.classList.remove('seleccionado'));
            div.classList.add('seleccionado');
            saborActual = sabor;
        };
        gridSabores.appendChild(div);
    });
}

function renderizarAdicionales(adicionalesMarcadosArray) {
    const listaAdds = document.getElementById("lista-adicionales");
    listaAdds.innerHTML = "";
    extrasDisp.forEach(ext => {
        const checked = adicionalesMarcadosArray.includes(ext.nombre) ? 'checked' : '';
        const div = document.createElement("div");
        div.className = "check-item";
        div.innerHTML = `
            <label>
                <input type="checkbox" class="add-checkbox" data-id="${ext.id}" data-nombre="${ext.nombre}" data-precio="${ext.precio}" onchange="recalcularConstructor()" ${checked}>
                ${ext.nombre}
            </label>
            <span class="precio-add">+$${formatMoneda(ext.precio)}</span>
        `;
        listaAdds.appendChild(div);
    });
}

function agregarNota(texto) {
    const textarea = document.getElementById("notas-input");
    const valorActual = textarea.value.trim();
    textarea.value = valorActual ? `${valorActual}, ${texto}` : texto;
}

function recalcularConstructor() {
    let subtotal = prodActual.precio;
    document.querySelectorAll('.add-checkbox:checked').forEach(chk => {
        subtotal += parseInt(chk.dataset.precio);
    });
    document.getElementById("subtotal-constructor").innerText = `$${formatMoneda(subtotal)}`;
    return subtotal;
}

function guardarEnCarrito() {
    if (!saborActual) return alert("Selecciona un sabor de la máquina.");

    let adicionales = [];
    document.querySelectorAll('.add-checkbox:checked').forEach(chk => {
        adicionales.push({ nombre: chk.dataset.nombre, precio: parseInt(chk.dataset.precio) });
    });

    const newItem = {
        producto: prodActual,
        sabor: saborActual,
        adicionales: adicionales,
        notas: document.getElementById("notas-input").value.trim(),
        subtotal: recalcularConstructor()
    };

    if (indexEdicion !== null) {
        carrito[indexEdicion] = newItem; // Sobrescribe si estamos editando
        indexEdicion = null;
    } else {
        carrito.push(newItem); // Agrega si es nuevo
    }

    actualizarBadge();
    cambiarVista('vista-carrito'); // Al guardar va directo al carrito
}

// CARRITO Y DOMICILIO
function actualizarBadge() {
    document.getElementById("cart-badge").innerText = carrito.length;
}

function renderizarCarrito() {
    const lista = document.getElementById("lista-carrito");
    lista.innerHTML = "";
    
    carrito.forEach((item, index) => {
        let adsHTML = item.adicionales.map(a => `➕ ${a.nombre} (+$${formatMoneda(a.precio)})`).join('<br>');
        let notasHTML = item.notas ? `📝 <i>${item.notas}</i>` : '';
        
        lista.innerHTML += `
            <div class="ticket-item" onclick="editarItem(${index})">
                <div class="ticket-header">
                    <span class="ticket-titulo">${item.producto.nombre} - ${item.sabor.nombre}</span>
                    <span class="ticket-precio-base">$${formatMoneda(item.producto.precio)}</span>
                </div>
                <div class="ticket-detalles">
                    ${adsHTML}<br>${notasHTML}
                </div>
                <div class="ticket-footer">
                    <button class="btn-eliminar-clean" onclick="event.stopPropagation(); eliminarItem(${index})">🗑️</button>
                    <span class="ticket-total">$${formatMoneda(item.subtotal)}</span>
                </div>
            </div>
        `;
    });
    actualizarTotal();
}

function eliminarItem(index) {
    carrito.splice(index, 1);
    actualizarBadge();
    renderizarCarrito();
    if(carrito.length === 0) volverCatalogo();
}

// LOGICA BLOQUEO DOMICILIO
function toggleDomicilio() {
    const contenedor = document.getElementById("input-domicilio-container");
    if (document.getElementById("chk-domicilio").checked) {
        contenedor.style.display = "block";
        desbloquearDomicilio();
    } else {
        contenedor.style.display = "none";
        document.getElementById("valor-domicilio").value = "";
        actualizarTotal();
    }
}

function fijarDomicilio() {
    const input = document.getElementById("valor-domicilio");
    if (!input.value) input.value = "0";
    document.getElementById("grupo-domicilio").classList.add("locked");
    input.setAttribute("readonly", true);
    actualizarTotal();
}

function desbloquearDomicilio() {
    document.getElementById("grupo-domicilio").classList.remove("locked");
    document.getElementById("valor-domicilio").removeAttribute("readonly");
    document.getElementById("valor-domicilio").focus();
}

function actualizarTotal() {
    let sumaProductos = carrito.reduce((acc, item) => acc + item.subtotal, 0);
    let valorDom = 0;
    
    if(document.getElementById("chk-domicilio").checked && document.getElementById("grupo-domicilio").classList.contains("locked")) {
        let inputVal = document.getElementById("valor-domicilio").value.replace(/\./g, '');
        valorDom = parseInt(inputVal) || 0;
    }

    const totalFactura = sumaProductos + valorDom;
    document.getElementById("total-comanda").innerText = `$${formatMoneda(totalFactura)}`;
    
    // Forzando los colores explícitos del Botón de Telegram
    if (document.getElementById('vista-carrito').classList.contains('activa') && carrito.length > 0) {
        tg.MainButton.text = `ENVIAR COMANDA - $${formatMoneda(totalFactura)}`;
        tg.MainButton.color = "#2481cc";      // Azul principal
        tg.MainButton.textColor = "#ffffff";  // Texto blanco
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

function enviarComanda() {
    let valorDom = 0;
    if(document.getElementById("chk-domicilio").checked && document.getElementById("grupo-domicilio").classList.contains("locked")) {
        valorDom = parseInt(document.getElementById("valor-domicilio").value.replace(/\./g, '')) || 0;
    }
    
    const payload = {
        carrito: carrito,
        domicilio: valorDom,
        total: carrito.reduce((acc, item) => acc + item.subtotal, 0) + valorDom
    };

    tg.sendData(JSON.stringify(payload));
    tg.close();
}