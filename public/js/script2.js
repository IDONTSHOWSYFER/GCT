document.addEventListener("DOMContentLoaded", () => {
  // --------------------------------------------------------------------
  // Sélection d'éléments du DOM
  // --------------------------------------------------------------------
  const characterContainer = document.getElementById("characterContainer");
  const versionButton = document.getElementById("versionButton");
  const selectionButtons = document.querySelectorAll(".part-button");
  const saveButton = document.getElementById("saveButton");
  const deleteButton = document.getElementById("deleteButton");
  const flipHorizontalButton = document.getElementById("flipHorizontalButton");
  const flipVerticalButton = document.getElementById("flipVerticalButton");
  const bringForwardButton = document.getElementById("bringForwardButton");
  const sendBackwardButton = document.getElementById("sendBackwardButton");
  const colorButtons = document.querySelectorAll(".color-button");
  const optionsDisplay = document.getElementById("optionsDisplay");
  const notification = document.getElementById("notification");
  const layersList = document.getElementById("layersList");

  // --------------------------------------------------------------------
  // Variables globales
  // --------------------------------------------------------------------
  let selectedElement = null; 
  let selectedPart = null;
  
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  let isRotating = false;
  let initialAngle = 0;
  let initialRotation = 0;
  let previousAngle = 0;

  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartY = 0;

  const MIN_SIZE = 50;  
  const MOBILE_BODY_SIZE = 100;   
  const DESKTOP_BODY_SIZE = 200;  

  // Un compteur global pour déterminer l'ordre de stacking
  let globalStack = 0;

  // --------------------------------------------------------------------
  // Fonctions utilitaires
  // --------------------------------------------------------------------
  function showNotification(message, type) {
    notification.textContent = message;
    notification.classList.remove("success", "error");
    notification.classList.add(type);
    notification.classList.add("show");
    setTimeout(() => {
      notification.classList.remove("show");
    }, 3000);
  }

  function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function rgbToHueDegrees(color) {
    let r, g, b;
    if (color.startsWith("#")) {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      const bigint = parseInt(hex, 16);
      r = (bigint >> 16) & 255;
      g = (bigint >> 8) & 255;
      b = bigint & 255;
    } else if (color.startsWith("rgb")) {
      const rgbValues = color.match(/\d+/g).map(Number);
      if (rgbValues.length < 3) return null;
      [r, g, b] = rgbValues;
    } else {
      const dummy = document.createElement("div");
      dummy.style.color = color;
      document.body.appendChild(dummy);
      const computedColor = window.getComputedStyle(dummy).color;
      document.body.removeChild(dummy);
      const rgbMatch = computedColor.match(/\d+/g).map(Number);
      if (rgbMatch.length < 3) return null;
      [r, g, b] = rgbMatch;
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let hue = 0;
    if (max === min) {
      hue = 0;
    } else if (max === r) {
      hue = (60 * ((g - b) / (max - min)) + 360) % 360;
    } else if (max === g) {
      hue = (60 * ((b - r) / (max - min)) + 120) % 360;
    } else {
      hue = (60 * ((r - g) / (max - min)) + 240) % 360;
    }
    return hue;
  }

  // --------------------------------------------------------------------
  // Gestion du stacking via une propriété personnalisée (dataset.stack)
  // --------------------------------------------------------------------
  function bringToFront(element) {
    globalStack++;
    element.dataset.stack = globalStack.toString();
    updateLayersList();
  }

  function sendToBack(element) {
    // On place cet élément derrière en lui assignant 0
    element.dataset.stack = "0";
    updateLayersList();
  }

  // --------------------------------------------------------------------
  // Fermeture des menus d’options
  // --------------------------------------------------------------------
  function closeAllDropdowns() {
    optionsDisplay.classList.remove("active");
    document.querySelectorAll(".options-group").forEach(group => {
      group.classList.remove("active");
      const part = group.id.split("-")[1];
      const partButton = document.querySelector(`.part-button[data-part="${part}"]`);
      if (partButton) {
        partButton.classList.remove("active");
        partButton.setAttribute("aria-expanded", "false");
      }
    });
    selectedPart = null;
  }

  // --------------------------------------------------------------------
  // Génération dynamique d’options
  // --------------------------------------------------------------------
  function generateDropdownOptions() {
    const parts = {
      hair: ["hair1", "hair2", "hair3"],
      eyes: ["eyes1", "eyes2", "eyes3"],
      mouth: ["mouth1", "mouth2", "mouth3"],
      body: ["body1", "body2", "body3"],
      accessories: ["accessory1", "accessory2", "accessory3"],
      clothes: ["clothe1", "clothe2", "clothe3"],
      background: ["red", "white", "black"]
    };

    for (const part in parts) {
      const optionsGroup = document.createElement("div");
      optionsGroup.id = `options-${part}`;
      optionsGroup.classList.add("options-group");
      const title = document.createElement("h3");
      title.textContent = `${capitalizeFirstLetter(part)} Options`;
      optionsGroup.appendChild(title);

      const optionsGrid = document.createElement("div");
      optionsGrid.classList.add("options-grid");

      parts[part].forEach(option => {
        const button = document.createElement("button");
        button.classList.add("option-button");
        button.dataset.part = part;
        button.dataset.option = option;
        button.setAttribute("aria-label", `${capitalizeFirstLetter(part)} Option ${option}`);

        const img = document.createElement("img");
        img.src = `/public/assets/v2/${part}/${option}.png`;
        img.alt = `${capitalizeFirstLetter(part)} ${option}`;
        img.onerror = () => {
          if (part === "background") {
            switch (option) {
              case "red":
                img.src = "/public/assets/v2/background/shape_red.png";
                break;
              case "white":
                img.src = "/public/assets/v2/background/shape_white.png";
                break;
              case "black":
                img.src = "/public/assets/v2/background/shape_black.png";
                break;
              default:
                img.src = "/public/assets/v2/background/shape_default.png";
            }
          } else {
            img.src = `/public/assets/v2/${part}/default.png`;
          }
        };

        button.appendChild(img);
        button.addEventListener("click", e => {
          e.stopPropagation();
          addElement(part, option);
          closeAllDropdowns();
        });
        optionsGrid.appendChild(button);
      });

      optionsGroup.appendChild(optionsGrid);
      optionsDisplay.appendChild(optionsGroup);
    }
  }

  // --------------------------------------------------------------------
  // Affichage des options pour une partie donnée
  // --------------------------------------------------------------------
  function displayOptions(part) {
    if (!part) return;
    if (selectedPart === part) {
      closeAllDropdowns();
      return;
    }
    optionsDisplay.classList.add("active");
    document.querySelectorAll(".options-group").forEach(group => {
      if (group.id !== `options-${part}`) {
        group.classList.remove("active");
        const otherPart = group.id.split("-")[1];
        const otherButton = document.querySelector(`.part-button[data-part="${otherPart}"]`);
        if (otherButton) {
          otherButton.classList.remove("active");
          otherButton.setAttribute("aria-expanded", "false");
        }
      }
    });
    const activeGroup = document.getElementById(`options-${part}`);
    if (activeGroup) {
      const isActive = activeGroup.classList.contains("active");
      activeGroup.classList.toggle("active", !isActive);
      activeGroup.setAttribute("aria-modal", !isActive);
      const partButton = document.querySelector(`.part-button[data-part="${part}"]`);
      if (partButton) {
        partButton.classList.toggle("active", !isActive);
        partButton.setAttribute("aria-expanded", !isActive);
      }
    }
    selectedPart = activeGroup.classList.contains("active") ? part : null;
  }

  // --------------------------------------------------------------------
  // Ajout d'un élément draggable
  // --------------------------------------------------------------------
  function addElement(part, option) {
    if (part === "background") {
      applyBackground(option);
      return;
    }
    const draggable = document.createElement("div");
    draggable.classList.add("draggable");
    draggable.dataset.part = part;
    draggable.dataset.option = option;
    draggable.dataset.rotation = "0";
    draggable.dataset.flipx = "false";
    draggable.dataset.flipy = "false";
    draggable.dataset.color = "";
    // Stockage du filter appliqué (pour la sauvegarde)
    draggable.dataset.filter = "";
    // Position initiale
    draggable.dataset.x = "0";
    draggable.dataset.y = "0";
    // Attribuer un identifiant unique pour le calque
    draggable.dataset.elementId = generateUniqueId();

    // Attribuer une valeur de stacking (augmente le compteur global)
    globalStack++;
    draggable.dataset.stack = globalStack.toString();

    // Création du container d'image
    const imgContainer = document.createElement("div");
    imgContainer.style.width = "100%";
    imgContainer.style.height = "100%";
    imgContainer.style.display = "flex";
    imgContainer.style.alignItems = "center";
    imgContainer.style.justifyContent = "center";
    imgContainer.style.pointerEvents = "none";

    const img = document.createElement("img");
    img.src = `/public/assets/v2/${part}/${option}.png`;
    img.alt = `${capitalizeFirstLetter(part)} ${option}`;
    img.onerror = () => {
      img.src = `/public/assets/v2/${part}/default.png`;
    };
    img.style.objectFit = "contain";
    img.style.width = "100%";
    img.style.height = "100%";

    imgContainer.appendChild(img);
    draggable.appendChild(imgContainer);

    // Définir une taille par défaut
    let defaultSize = 100;
    if (part === "body") {
      defaultSize = window.innerWidth < 768 ? MOBILE_BODY_SIZE : DESKTOP_BODY_SIZE;
    }
    draggable.style.width = defaultSize + "px";
    draggable.style.height = defaultSize + "px";

    // Ajout des poignées de redimensionnement
    ["br", "bl", "tr", "tl"].forEach(handle => {
      const rh = document.createElement("div");
      rh.classList.add("resize-handle", handle);
      draggable.appendChild(rh);
      rh.addEventListener("mousedown", e => startResize(e, draggable, handle));
      rh.addEventListener("touchstart", e => startResizeTouch(e, draggable, handle), { passive: false });
    });

    // Ajout de la poignée de rotation
    const rotateHandle = document.createElement("div");
    rotateHandle.classList.add("rotate-handle");
    draggable.appendChild(rotateHandle);
    rotateHandle.addEventListener("mousedown", e => startRotate(e, draggable));
    rotateHandle.addEventListener("touchstart", e => startRotateTouch(e, draggable), { passive: false });

    // Bouton de verrouillage
    const lockButton = document.createElement("button");
    lockButton.classList.add("lock-button");
    lockButton.setAttribute("aria-label", "Lock/Unlock Element");
    draggable.appendChild(lockButton);
    lockButton.addEventListener("click", ev => {
      ev.stopPropagation();
      toggleLock(draggable, lockButton);
    });
    lockButton.addEventListener("touchend", ev => {
      ev.stopPropagation();
      toggleLock(draggable, lockButton);
    });

    // Activation du drag (souris et tactile)
    draggable.addEventListener("mousedown", e => {
      const isHandle = e.target.classList.contains("resize-handle") || e.target.classList.contains("rotate-handle");
      if (!draggable.classList.contains("locked") && !isHandle) {
        startDrag(e, draggable);
      }
      selectElement(draggable);
    });
    draggable.addEventListener("touchstart", e => {
      const isHandle = e.target.classList.contains("resize-handle") || e.target.classList.contains("rotate-handle");
      if (!draggable.classList.contains("locked") && !isHandle) {
        startDragTouch(e, draggable);
      }
      selectElement(draggable);
    }, { passive: false });

    // Ajout de l'élément dans le conteneur (l'ordre DOM n'est plus utilisé pour le stacking)
    characterContainer.appendChild(draggable);

    // Pour le body, centre automatiquement
    if (part === "body") {
      setTimeout(() => {
        centerElementInContainer(draggable);
      }, 0);
    }
    selectElement(draggable);
    updateLayersList();
  }

  // --------------------------------------------------------------------
  // Verrouillage / déverrouillage
  // --------------------------------------------------------------------
  function toggleLock(element, lockButton) {
    element.classList.toggle("locked");
    const locked = element.classList.contains("locked");
    lockButton.classList.toggle("locked", locked);
    showNotification(locked ? "Élément verrouillé." : "Élément déverrouillé.", "success");
    updateLayersList();
  }

  // --------------------------------------------------------------------
  // Sélection d'un élément
  // --------------------------------------------------------------------
  function selectElement(element) {
    if (selectedElement && selectedElement !== element) {
      selectedElement.classList.remove("selected");
    }
    selectedElement = element;
    selectedElement.classList.add("selected");
    selectedPart = element.dataset.part;
    selectionButtons.forEach(btn => {
      if (btn.dataset.part === selectedPart) {
        btn.classList.add("active");
        btn.setAttribute("aria-expanded", "true");
      } else {
        btn.classList.remove("active");
        btn.setAttribute("aria-expanded", "false");
      }
    });
    updateLayersList();
  }

  // --------------------------------------------------------------------
  // Drag (souris)
  // --------------------------------------------------------------------
  function startDrag(e, element) {
    bringToFront(element);
    isDragging = true;
    const currentX = parseFloat(element.dataset.x) || 0;
    const currentY = parseFloat(element.dataset.y) || 0;
    dragOffsetX = e.clientX - currentX;
    dragOffsetY = e.clientY - currentY;
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
  }

  function onDragMove(e) {
    if (!isDragging || !selectedElement || selectedElement.classList.contains("locked")) return;
    const containerRect = characterContainer.getBoundingClientRect();
    const elRect = selectedElement.getBoundingClientRect();
    let newX = e.clientX - dragOffsetX;
    let newY = e.clientY - dragOffsetY;
    newX = Math.max(0, Math.min(newX, containerRect.width - elRect.width));
    newY = Math.max(0, Math.min(newY, containerRect.height - elRect.height));
    selectedElement.dataset.x = newX.toString();
    selectedElement.dataset.y = newY.toString();
    updateTransform(selectedElement);
    updateLayersList();
  }

  function onDragEnd() {
    isDragging = false;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
  }

  // --------------------------------------------------------------------
  // Drag tactile
  // --------------------------------------------------------------------
  function startDragTouch(e, element) {
    bringToFront(element);
    isDragging = true;
    const touch = e.touches[0];
    const currentX = parseFloat(element.dataset.x) || 0;
    const currentY = parseFloat(element.dataset.y) || 0;
    dragOffsetX = touch.clientX - currentX;
    dragOffsetY = touch.clientY - currentY;
    document.addEventListener("touchmove", onDragMoveTouch, { passive: false });
    document.addEventListener("touchend", onDragEndTouch, { passive: false });
    document.addEventListener("touchcancel", onDragEndTouch, { passive: false });
  }

  function onDragMoveTouch(e) {
    if (!isDragging || !selectedElement || selectedElement.classList.contains("locked")) return;
    e.preventDefault();
    const touch = e.touches[0];
    const containerRect = characterContainer.getBoundingClientRect();
    const elRect = selectedElement.getBoundingClientRect();
    let newX = touch.clientX - dragOffsetX;
    let newY = touch.clientY - dragOffsetY;
    newX = Math.max(0, Math.min(newX, containerRect.width - elRect.width));
    newY = Math.max(0, Math.min(newY, containerRect.height - elRect.height));
    selectedElement.dataset.x = newX.toString();
    selectedElement.dataset.y = newY.toString();
    updateTransform(selectedElement);
    updateLayersList();
  }

  function onDragEndTouch() {
    isDragging = false;
    document.removeEventListener("touchmove", onDragMoveTouch);
    document.removeEventListener("touchend", onDragEndTouch);
    document.removeEventListener("touchcancel", onDragEndTouch);
  }

  // --------------------------------------------------------------------
  // Rotation (souris)
  // --------------------------------------------------------------------
  function startRotate(e, element) {
    bringToFront(element);
    isRotating = true;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    initialRotation = parseFloat(element.dataset.rotation) || 0;
    previousAngle = initialAngle;
    document.addEventListener("mousemove", onRotateMove);
    document.addEventListener("mouseup", onRotateEnd);
  }

  function onRotateMove(e) {
    if (!isRotating || !selectedElement || selectedElement.classList.contains("locked")) return;
    const rect = selectedElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    let deltaAngle = currentAngle - previousAngle;
    if (deltaAngle > 180) deltaAngle -= 360;
    else if (deltaAngle < -180) deltaAngle += 360;
    initialRotation += deltaAngle;
    selectedElement.dataset.rotation = initialRotation.toString();
    updateTransform(selectedElement);
    previousAngle = currentAngle;
    updateLayersList();
  }

  function onRotateEnd() {
    isRotating = false;
    document.removeEventListener("mousemove", onRotateMove);
    document.removeEventListener("mouseup", onRotateEnd);
  }

  // --------------------------------------------------------------------
  // Rotation tactile
  // --------------------------------------------------------------------
  function startRotateTouch(e, element) {
    bringToFront(element);
    isRotating = true;
    const touch = e.touches[0];
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    initialAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
    initialRotation = parseFloat(element.dataset.rotation) || 0;
    previousAngle = initialAngle;
    document.addEventListener("touchmove", onRotateMoveTouch, { passive: false });
    document.addEventListener("touchend", onRotateEndTouch, { passive: false });
    document.addEventListener("touchcancel", onRotateEndTouch, { passive: false });
  }

  function onRotateMoveTouch(e) {
    if (!isRotating || !selectedElement || selectedElement.classList.contains("locked")) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = selectedElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
    let deltaAngle = currentAngle - previousAngle;
    if (deltaAngle > 180) deltaAngle -= 360;
    else if (deltaAngle < -180) deltaAngle += 360;
    initialRotation += deltaAngle;
    selectedElement.dataset.rotation = initialRotation.toString();
    updateTransform(selectedElement);
    previousAngle = currentAngle;
    updateLayersList();
  }

  function onRotateEndTouch() {
    isRotating = false;
    document.removeEventListener("touchmove", onRotateMoveTouch);
    document.removeEventListener("touchend", onRotateEndTouch);
    document.removeEventListener("touchcancel", onRotateEndTouch);
  }

  // --------------------------------------------------------------------
  // Redimensionnement
  // --------------------------------------------------------------------
  function startResize(e, element, handle) {
    bringToFront(element);
    isResizing = true;
    const originalWidth = element.offsetWidth;
    const originalHeight = element.offsetHeight;
    const originalAspectRatio = originalWidth / originalHeight;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;

    function onResizeMove(ev) {
      if (!isResizing || element.classList.contains("locked")) return;
      let dx = ev.clientX - resizeStartX;
      let newWidth = originalWidth;
      let newHeight = originalHeight;
      switch (handle) {
        case "br":
          newWidth = originalWidth + dx;
          newHeight = newWidth / originalAspectRatio;
          break;
        case "bl":
          newWidth = originalWidth - dx;
          newHeight = newWidth / originalAspectRatio;
          break;
        case "tr":
          const dy = ev.clientY - resizeStartY;
          newHeight = originalHeight - dy;
          newWidth = newHeight * originalAspectRatio;
          break;
        case "tl":
          const dy2 = ev.clientY - resizeStartY;
          newHeight = originalHeight - dy2;
          newWidth = newHeight * originalAspectRatio;
          break;
      }
      if (newWidth < MIN_SIZE) {
        newWidth = MIN_SIZE;
        newHeight = newWidth / originalAspectRatio;
      }
      if (newHeight < MIN_SIZE) {
        newHeight = MIN_SIZE;
        newWidth = newHeight * originalAspectRatio;
      }
      const containerRect = characterContainer.getBoundingClientRect();
      const currentX = parseFloat(element.dataset.x) || 0;
      const currentY = parseFloat(element.dataset.y) || 0;
      const maxWidth = containerRect.width - currentX;
      const maxHeight = containerRect.height - currentY;
      if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = newWidth / originalAspectRatio;
      }
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * originalAspectRatio;
      }

      element.style.width = newWidth + "px";
      element.style.height = newHeight + "px";
      updateTransform(element);
      updateLayersList();
    }

    function onResizeEnd() {
      isResizing = false;
      document.removeEventListener("mousemove", onResizeMove);
      document.removeEventListener("mouseup", onResizeEnd);
    }

    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", onResizeEnd);
  }

  function startResizeTouch(e, element, handle) {
    bringToFront(element);
    isResizing = true;
    const touch = e.touches[0];
    const originalWidth = element.offsetWidth;
    const originalHeight = element.offsetHeight;
    const originalAspectRatio = originalWidth / originalHeight;
    resizeStartX = touch.clientX;
    resizeStartY = touch.clientY;
    e.preventDefault();

    function onResizeMoveTouch(ev) {
      if (!isResizing || element.classList.contains("locked")) return;
      ev.preventDefault();
      const moveTouch = ev.touches[0];
      let dx = moveTouch.clientX - resizeStartX;
      let newWidth = originalWidth;
      let newHeight = originalHeight;
      switch (handle) {
        case "br":
          newWidth = originalWidth + dx;
          newHeight = newWidth / originalAspectRatio;
          break;
        case "bl":
          newWidth = originalWidth - dx;
          newHeight = newWidth / originalAspectRatio;
          break;
        case "tr":
          const dy = moveTouch.clientY - resizeStartY;
          newHeight = originalHeight - dy;
          newWidth = newHeight * originalAspectRatio;
          break;
        case "tl":
          const dy2 = moveTouch.clientY - resizeStartY;
          newHeight = originalHeight - dy2;
          newWidth = newHeight * originalAspectRatio;
          break;
      }
      if (newWidth < MIN_SIZE) {
        newWidth = MIN_SIZE;
        newHeight = newWidth / originalAspectRatio;
      }
      if (newHeight < MIN_SIZE) {
        newHeight = MIN_SIZE;
        newWidth = newHeight * originalAspectRatio;
      }
      const containerRect = characterContainer.getBoundingClientRect();
      const currentX = parseFloat(element.dataset.x) || 0;
      const currentY = parseFloat(element.dataset.y) || 0;
      const maxWidth = containerRect.width - currentX;
      const maxHeight = containerRect.height - currentY;
      if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = newWidth / originalAspectRatio;
      }
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * originalAspectRatio;
      }

      element.style.width = newWidth + "px";
      element.style.height = newHeight + "px";
      updateTransform(element);
      updateLayersList();
    }

    function onResizeEndTouch() {
      isResizing = false;
      document.removeEventListener("touchmove", onResizeMoveTouch);
      document.removeEventListener("touchend", onResizeEndTouch);
      document.removeEventListener("touchcancel", onResizeEndTouch);
    }

    document.addEventListener("touchmove", onResizeMoveTouch, { passive: false });
    document.addEventListener("touchend", onResizeEndTouch, { passive: false });
    document.addEventListener("touchcancel", onResizeEndTouch, { passive: false });
  }

  // --------------------------------------------------------------------
  // Application des transformations (translation, rotation, flip)
  // --------------------------------------------------------------------
  function updateTransform(element) {
    const rotation = parseFloat(element.dataset.rotation) || 0;
    const flipX = (element.dataset.flipx === "true");
    const flipY = (element.dataset.flipy === "true");
    const x = parseFloat(element.dataset.x) || 0;
    const y = parseFloat(element.dataset.y) || 0;

    let transformString = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
    if (flipX) transformString += " scaleX(-1)";
    if (flipY) transformString += " scaleY(-1)";
    element.style.transform = transformString;
    element.style.transformOrigin = "center center";
  }

  // --------------------------------------------------------------------
  // Application des couleurs sur l'asset (<img>) et stockage du filter
  // --------------------------------------------------------------------
  function applyColorToElement(element, color) {
    const img = element.querySelector("img");
    if (!img) return;

    if (color === "reset") {
      element.dataset.color = "";
      element.dataset.filter = "";
      img.style.filter = "none";
    } else {
      element.dataset.color = color;
      const hue = rgbToHueDegrees(color);
      let filterValue = "none";
      if (hue !== null) {
        filterValue = `sepia(1) saturate(10000%) hue-rotate(${hue}deg)`;
      }
      element.dataset.filter = filterValue;
      img.style.filter = filterValue;
    }
  }

  // --------------------------------------------------------------------
  // Application du background
  // --------------------------------------------------------------------
  function applyBackground(option) {
    if (["bg1", "bg2", "bg3"].includes(option)) {
      characterContainer.style.backgroundImage = `url('/public/assets/v2/background/${option}.png')`;
      characterContainer.style.backgroundColor = "transparent";
    } else if (option === "reset") {
      characterContainer.style.backgroundImage = "none";
      characterContainer.style.backgroundColor = "#ffffff";
    } else {
      switch (option) {
        case "red":
          characterContainer.style.backgroundColor = "#FF0000";
          break;
        case "black":
          characterContainer.style.backgroundColor = "#000000";
          break;
        case "white":
          characterContainer.style.backgroundColor = "#FFFFFF";
          break;
        default:
          characterContainer.style.backgroundColor = option;
      }
      characterContainer.style.backgroundImage = "none";
    }
  }

  // --------------------------------------------------------------------
  // Centrer un élément dans le conteneur
  // --------------------------------------------------------------------
  function centerElementInContainer(element) {
    const containerRect = characterContainer.getBoundingClientRect();
    const elRect = element.getBoundingClientRect();
    const centerX = (containerRect.width - elRect.width) / 2;
    const centerY = (containerRect.height - elRect.height) / 2;
    element.dataset.x = centerX.toString();
    element.dataset.y = centerY.toString();
    updateTransform(element);
  }

  // Génération d'un ID unique pour chaque élément
  function generateUniqueId() {
    return "el-" + Math.random().toString(36).substr(2, 9);
  }

  // --------------------------------------------------------------------
  // Mise à jour de la liste des calques (triés par dataset.stack)
  // --------------------------------------------------------------------
  function updateLayersList() {
    const elements = Array.from(characterContainer.querySelectorAll(".draggable"));
    // Tri par ordre croissant du stack (les plus faibles d'abord)
    elements.sort((a, b) => parseInt(a.dataset.stack) - parseInt(b.dataset.stack));
    layersList.innerHTML = "";
    elements.forEach(el => {
      const li = document.createElement("li");
      li.dataset.elementId = el.dataset.elementId;
      const icon = document.createElement("img");
      icon.classList.add("layer-icon");
      icon.src = `/public/assets/v2/${el.dataset.part}/${el.dataset.option}.png`;
      icon.alt = `${capitalizeFirstLetter(el.dataset.part)} ${el.dataset.option}`;
      icon.onerror = () => {
        if (el.dataset.part === "background") {
          switch (el.dataset.option) {
            case "red":
              icon.src = "/public/assets/v2/background/shape_red.png";
              break;
            case "white":
              icon.src = "/public/assets/v2/background/shape_white.png";
              break;
            case "black":
              icon.src = "/public/assets/v2/background/shape_black.png";
              break;
            default:
              icon.src = "/public/assets/v2/background/shape_default.png";
          }
        } else {
          icon.src = `/public/assets/v2/${el.dataset.part}/default.png`;
        }
      };
      li.appendChild(icon);

      const actionsDiv = document.createElement("div");
      actionsDiv.classList.add("layer-actions");

      const upBtn = document.createElement("button");
      upBtn.classList.add("move-up");
      upBtn.setAttribute("aria-label", "Move Up");
      upBtn.textContent = "▲";
      upBtn.addEventListener("click", ev => {
        ev.stopPropagation();
        bringToFront(el);
      });

      const downBtn = document.createElement("button");
      downBtn.classList.add("move-down");
      downBtn.setAttribute("aria-label", "Move Down");
      downBtn.textContent = "▼";
      downBtn.addEventListener("click", ev => {
        ev.stopPropagation();
        sendToBack(el);
      });

      actionsDiv.appendChild(upBtn);
      actionsDiv.appendChild(downBtn);
      li.appendChild(actionsDiv);

      li.addEventListener("click", () => {
        selectElement(el);
      });
      layersList.appendChild(li);

      if (selectedElement && selectedElement.dataset.elementId === el.dataset.elementId) {
        li.classList.add("selected");
      }
    });
  }

  // --------------------------------------------------------------------
  // Sauvegarde en PNG (tri par dataset.stack)
  // --------------------------------------------------------------------
  saveButton.addEventListener("click", () => {
    const containerRect = characterContainer.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = containerRect.width * ratio;
    tempCanvas.height = containerRect.height * ratio;
    const ctx = tempCanvas.getContext("2d");
    ctx.scale(ratio, ratio);

    // Gestion du background
    const bgImage = characterContainer.style.backgroundImage;
    if (bgImage && bgImage !== "none") {
      const bgUrl = bgImage.slice(5, -2);
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = bgUrl;
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, containerRect.width, containerRect.height);
        drawElementsToCanvas(ctx, tempCanvas);
      };
      bgImg.onerror = () => {
        ctx.fillStyle = characterContainer.style.backgroundColor || "#ffffff";
        ctx.fillRect(0, 0, containerRect.width, containerRect.height);
        drawElementsToCanvas(ctx, tempCanvas);
      };
    } else {
      ctx.fillStyle = characterContainer.style.backgroundColor || "#ffffff";
      ctx.fillRect(0, 0, containerRect.width, containerRect.height);
      drawElementsToCanvas(ctx, tempCanvas);
    }
  });

  function drawElementsToCanvas(ctx, canvas) {
    // Récupère tous les éléments draggable et trie par dataset.stack
    const elements = Array.from(characterContainer.querySelectorAll(".draggable"));
    elements.sort((a, b) => parseInt(a.dataset.stack) - parseInt(b.dataset.stack));
    if (elements.length === 0) {
      downloadCanvas(canvas);
      return;
    }
    const promises = elements.map(el => {
      return new Promise(resolve => {
        const imgElement = el.querySelector("img");
        if (!imgElement) {
          resolve();
          return;
        }
        const originalImg = new Image();
        originalImg.crossOrigin = "anonymous";
        originalImg.src = imgElement.src;
        originalImg.onload = () => {
          drawSingleElement(ctx, el, imgElement, originalImg);
          resolve();
        };
        originalImg.onerror = () => {
          resolve();
        };
      });
    });
    Promise.all(promises).then(() => {
      downloadCanvas(canvas);
    });
  }

  function drawSingleElement(ctx, element, imgElement, originalImg) {
    const x = parseFloat(element.dataset.x) || 0;
    const y = parseFloat(element.dataset.y) || 0;
    const w = element.offsetWidth;
    const h = element.offsetHeight;
    const rotation = parseFloat(element.dataset.rotation) || 0;
    const flipX = (element.dataset.flipx === "true");
    const flipY = (element.dataset.flipy === "true");

    const storedFilter = element.dataset.filter;
    const computedFilter = window.getComputedStyle(imgElement).filter;
    const finalFilter = (storedFilter && storedFilter !== "") ? storedFilter :
                        (computedFilter && computedFilter !== "none" ? computedFilter : "none");

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    if (flipX) ctx.scale(-1, 1);
    if (flipY) ctx.scale(1, -1);
    ctx.filter = finalFilter;
    ctx.drawImage(originalImg, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function downloadCanvas(canvas) {
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "avatar.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --------------------------------------------------------------------
  // Boutons d'actions (flip, delete, etc.)
  // --------------------------------------------------------------------
  flipHorizontalButton.addEventListener("click", () => {
    if (!selectedElement) {
      showNotification("Aucun élément sélectionné.", "error");
      return;
    }
    if (selectedElement.classList.contains("locked")) {
      showNotification("Élément verrouillé, action impossible.", "error");
      return;
    }
    const flipX = (selectedElement.dataset.flipx === "true");
    selectedElement.dataset.flipx = (!flipX).toString();
    updateTransform(selectedElement);
    updateLayersList();
  });

  flipVerticalButton.addEventListener("click", () => {
    if (!selectedElement) {
      showNotification("Aucun élément sélectionné.", "error");
      return;
    }
    if (selectedElement.classList.contains("locked")) {
      showNotification("Élément verrouillé, action impossible.", "error");
      return;
    }
    const flipY = (selectedElement.dataset.flipy === "true");
    selectedElement.dataset.flipy = (!flipY).toString();
    updateTransform(selectedElement);
    updateLayersList();
  });

  bringForwardButton.addEventListener("click", () => {
    if (!selectedElement) {
      showNotification("Aucun élément sélectionné.", "error");
      return;
    }
    if (selectedElement.classList.contains("locked")) {
      showNotification("Élément verrouillé, action impossible.", "error");
      return;
    }
    bringToFront(selectedElement);
    showNotification("Élément déplacé vers l'avant.", "success");
  });

  sendBackwardButton.addEventListener("click", () => {
    if (!selectedElement) {
      showNotification("Aucun élément sélectionné.", "error");
      return;
    }
    if (selectedElement.classList.contains("locked")) {
      showNotification("Élément verrouillé, action impossible.", "error");
      return;
    }
    sendToBack(selectedElement);
    showNotification("Élément déplacé vers l'arrière.", "success");
  });

  deleteButton.addEventListener("click", () => {
    if (!selectedElement) {
      showNotification("Aucun élément sélectionné à supprimer.", "error");
      return;
    }
    if (selectedElement.classList.contains("locked")) {
      showNotification("L'élément est verrouillé et ne peut pas être supprimé.", "error");
      return;
    }
    selectedElement.remove();
    selectedElement = null;
    selectedPart = null;
    closeAllDropdowns();
    updateLayersList();
    showNotification("Élément supprimé.", "success");
  });

  // --------------------------------------------------------------------
  // Boutons de couleur (application sur le background ou sur l'asset)
  // --------------------------------------------------------------------
  colorButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color;
      if (!selectedElement) {
        if (selectedPart === "background") {
          if (color === "reset") {
            applyBackground("reset");
            showNotification("Couleur de fond réinitialisée.", "success");
          } else {
            applyBackground(color);
            showNotification("Couleur de fond appliquée.", "success");
          }
        } else {
          showNotification("Veuillez sélectionner un élément.", "error");
        }
        return;
      }
      if (selectedPart === "background") {
        if (color === "reset") {
          applyBackground("reset");
          showNotification("Couleur de fond réinitialisée.", "success");
        } else {
          applyBackground(color);
          showNotification("Couleur de fond appliquée.", "success");
        }
        return;
      }
      if (color === "reset") {
        applyColorToElement(selectedElement, "reset");
        showNotification("Couleur réinitialisée.", "success");
      } else {
        applyColorToElement(selectedElement, color);
        showNotification("Couleur appliquée.", "success");
      }
    });
  });

  // --------------------------------------------------------------------
  // Gestion du clic pour afficher les options de partie
  // --------------------------------------------------------------------
  selectionButtons.forEach(button => {
    button.addEventListener("click", e => {
      e.stopPropagation();
      const part = button.dataset.part;
      displayOptions(part);
    });
  });

  document.addEventListener("click", e => {
    if (!optionsDisplay.contains(e.target) &&
        ![...selectionButtons].some(btn => btn.contains(e.target))) {
      closeAllDropdowns();
    }
  });

  window.addEventListener("resize", () => {
    if (selectedElement && selectedElement.dataset.part === "body") {
      const newSize = window.innerWidth < 768 ? MOBILE_BODY_SIZE : DESKTOP_BODY_SIZE;
      selectedElement.style.width = newSize + "px";
      selectedElement.style.height = newSize + "px";
      updateTransform(selectedElement);
      updateLayersList();
    }
  });

  // --------------------------------------------------------------------
  // Initialisation
  // --------------------------------------------------------------------
  function initializeBody() {
    addElement("body", "body1");
  }

  versionButton.addEventListener("click", () => {
    window.location.href = "/index.html";
  });

  generateDropdownOptions();
  initializeBody();
  updateLayersList();
});