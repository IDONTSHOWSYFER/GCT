document.addEventListener("DOMContentLoaded", () => {
  // --------------------------------------------------------------------
  // Récupération des éléments du DOM
  // --------------------------------------------------------------------
  const characterContainer = document.getElementById("characterContainer");
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const closeSidebar = document.getElementById("closeSidebar");
  const selectionButtons = document.querySelectorAll(".part-button");

  const saveButton = document.getElementById("saveButton");
  const deleteButton = document.getElementById("deleteButton");
  const flipHorizontalButton = document.getElementById("flipHorizontalButton");
  const flipVerticalButton = document.getElementById("flipVerticalButton");
  const bringForwardButton = document.getElementById("bringForwardButton");
  const sendBackwardButton = document.getElementById("sendBackwardButton");

  const colorButtons = document.querySelectorAll(".color-button");
  const versionButton = document.getElementById("versionButton");

  const uploadButton = document.querySelector(".upload-button");
  const uploadInput = document.getElementById("backgroundUploadInput");

  // --------------------------------------------------------------------
  // Variables globales
  // --------------------------------------------------------------------
  let selectedPart = null;
  let selectedElement = null;

  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  let isRotating = false;
  let initialAngle = 0;
  let initialRotation = 0;

  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeHandle = null;
  let resizeStartWidth = 0;
  let resizeStartHeight = 0;

  // --------------------------------------------------------------------
  // Fonctions utilitaires
  // --------------------------------------------------------------------
  function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function rgbToHueDegrees(color) {
    let r, g, b;
    if (color.startsWith("#")) {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
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
    if (max === min) hue = 0;
    else if (max === r) hue = (60 * ((g - b) / (max - min)) + 360) % 360;
    else if (max === g) hue = (60 * ((b - r) / (max - min)) + 120) % 360;
    else hue = (60 * ((r - g) / (max - min)) + 240) % 360;
    return hue;
  }

  function getMaxZIndex() {
    let max = 0;
    characterContainer.querySelectorAll(".draggable").forEach(el => {
      const z = parseInt(el.dataset.zindex) || 0;
      if (z > max) max = z;
    });
    return max;
  }

  function bringToFront(element) {
    const newZ = getMaxZIndex() + 1;
    element.style.zIndex = newZ;
    element.dataset.zindex = newZ.toString();
  }

  function sendToBack(element) {
    const newZ = Math.max(0, getMaxZIndex() - 1);
    element.style.zIndex = newZ.toString();
    element.dataset.zindex = newZ.toString();
  }

  function closeAllDropdowns() {
    document.querySelectorAll(".options-display").forEach(group => {
      group.classList.remove("active");
      group.setAttribute("aria-modal", "false");
      const part = group.id.split("-")[1];
      const partButton = document.querySelector(`.part-button[data-part="${part}"]`);
      if (partButton) {
        partButton.classList.remove("active");
        partButton.setAttribute("aria-expanded", "false");
      }
      const colorSelection = group.querySelector(".color-selection");
      if (colorSelection) colorSelection.style.display = "none";
    });
    selectedPart = null;
  }

  function generateDropdownOptions() {
    const parts = {
      hair: ["hair1", "hair2", "hair3", "hair4", "hair5", "hair6", "hair7", "hair8", "hair9", "hair10", "hair11", "hair12", "hair13", "hair14", "hair15", "hair16", "hair17"],
      eyes: ["eyes1", "eyes2", "eyes3", "eyes4", "eyes5", "eyes6", "eyes7", "eyes8", "eyes9", "eyes10", "eyes11", "eyes12", "eyes13", "eyes14", "eyes15"],
      mouth: ["mouth1", "mouth2", "mouth3", "mouth4", "mouth5", "mouth6", "mouth7", "mouth8", "mouth9", "mouth10", "mouth11", "mouth12", "mouth13", "mouth14", "mouth15"],
      body: ["body1", "body2", "body3", "body4", "body5", "body6", "body7", "body8", "body9", "body10"],
      accessories: ["accessory1", "accessory2", "accessory3", "accessory4", "accessory5", "accessory6", "accessory7", "accessory8", "accessory9", "accessory10", "accessory11", "accessory12", "accessory13", "accessory14", "accessory15", "accessory16", "accessory17", "accessory18", "accessory19", "accessory20", "accessory21", "accessory22", "accessory23", "accessory24", "accessory25", "accessory26", "accessory27"],
      hat: ["hat1", "hat2", "hat3", "hat4", "hat5", "hat6", "hat7", "hat8", "hat9", "hat10", "hat11", "hat12", "hat13", "hat14", "hat15", "hat16", "hat17", "hat18", "hat19", "hat20", "hat21"],
      clothes: ["clothes1", "clothes2", "clothes3", "clothes4", "clothes5", "clothes6", "clothes7", "clothes8", "clothes9", "clothes10", "clothes11", "clothes12", "clothes13", "clothes14", "clothes15", "clothes16", "clothes17", "clothes18", "clothes19", "clothes20"],
      background: ["bg1", "bg2", "bg3", "bg4", "bg5", "bg6", "bg7", "bg8", "bg9", "bg10"]
    };

    for (const part in parts) {
      const optionsGroup = document.getElementById(`options-${part}`);
      if (!optionsGroup) continue;
      const optionsGrid = optionsGroup.querySelector(".options-grid");
      if (!optionsGrid) continue;
      parts[part].forEach(option => {
        const button = document.createElement("button");
        button.classList.add("option-button");
        button.dataset.part = part;
        button.dataset.option = option;
        button.setAttribute("aria-label", `${capitalizeFirstLetter(part)} Option ${option}`);
        const img = document.createElement("img");
        img.src = `public/assets/v1/${part}/${option}.png`;
        img.alt = `${capitalizeFirstLetter(part)} ${option}`;
        img.onerror = () => { img.src = `public/assets/v1/${part}/default.png`; };
        button.appendChild(img);
        button.addEventListener("click", e => {
          e.stopPropagation();
          addElement(part, option);
          closeAllDropdowns();
        });
        button.addEventListener("keydown", e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            button.click();
          }
        });
        optionsGrid.appendChild(button);
      });
    }
  }

  function displayOptions(part) {
    if (!part) return;
    document.querySelectorAll(".options-display").forEach(group => {
      if (group.id !== `options-${part}`) {
        group.classList.remove("active");
        group.setAttribute("aria-modal", "false");
        const otherPart = group.id.split("-")[1];
        const partButton = document.querySelector(`.part-button[data-part="${otherPart}"]`);
        if (partButton) {
          partButton.classList.remove("active");
          partButton.setAttribute("aria-expanded", "false");
        }
        const colorSelection = group.querySelector(".color-selection");
        if (colorSelection) colorSelection.style.display = "none";
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
      const colorSelection = activeGroup.querySelector(".color-selection");
      if (colorSelection) colorSelection.style.display = !isActive ? "block" : "none";
    }
  }

  function addElement(part, option) {
    if (part === "background") {
      applyBackgroundImage(option);
      return;
    }
    const draggable = document.createElement("div");
    draggable.classList.add("draggable");
    draggable.dataset.part = part;
    draggable.dataset.option = option;
    draggable.dataset.rotation = "0";
    draggable.dataset.scale = "1";
    draggable.dataset.flipx = "false";
    draggable.dataset.flipy = "false";
    draggable.dataset.color = "";
    draggable.style.left = "0px";
    draggable.style.top = "0px";
    draggable.style.width = "50px";
    draggable.style.height = "50px";
    const currentZ = getMaxZIndex() + 1;
    draggable.style.zIndex = currentZ.toString();
    draggable.dataset.zindex = currentZ.toString();
    draggable.style.position = "absolute";
    draggable.style.cursor = "move";
    draggable.style.userSelect = "none";
    draggable.style.touchAction = "none";

    const imageContainer = document.createElement("div");
    imageContainer.style.width = "100%";
    imageContainer.style.height = "100%";
    imageContainer.style.display = "flex";
    imageContainer.style.alignItems = "center";
    imageContainer.style.justifyContent = "center";
    imageContainer.style.transformOrigin = "center center";
    imageContainer.style.pointerEvents = "none";

    const img = document.createElement("img");
    img.src = `public/assets/v1/${part}/${option}.png`;
    img.alt = `${capitalizeFirstLetter(part)} ${option}`;
    img.style.width = "100%";
    img.style.height = "100%";
    img.onerror = () => { img.src = `public/assets/v1/${part}/default.png`; };
    img.addEventListener("load", () => {
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      draggable.dataset.naturalWidth = naturalW;
      draggable.dataset.naturalHeight = naturalH;
      const maxWidth = characterContainer.clientWidth * 0.5;
      const maxHeight = characterContainer.clientHeight * 0.5;
      const ratio = Math.min(1, maxWidth / naturalW, maxHeight / naturalH);
      const displayW = naturalW * ratio;
      const displayH = naturalH * ratio;
      draggable.style.width = displayW + "px";
      draggable.style.height = displayH + "px";
      draggable.dataset.scale = ratio;
      if (part === "body") centerElement(draggable);
    });

    imageContainer.appendChild(img);
    draggable.appendChild(imageContainer);

    ["br", "bl", "tr", "tl"].forEach(handle => {
      const resizeHandle = document.createElement("div");
      resizeHandle.classList.add("resize-handle", handle);
      resizeHandle.setAttribute("aria-label", `Resize Handle ${handle}`);
      draggable.appendChild(resizeHandle);
      resizeHandle.addEventListener("mousedown", e => startResize(e, draggable, handle));
      resizeHandle.addEventListener("touchstart", e => startResizeTouch(e, draggable, handle), { passive: false });
    });

    const rotateHandle = document.createElement("div");
    rotateHandle.classList.add("rotate-handle");
    rotateHandle.setAttribute("aria-label", "Rotate Handle");
    draggable.appendChild(rotateHandle);
    rotateHandle.addEventListener("mousedown", e => startRotate(e, draggable));
    rotateHandle.addEventListener("touchstart", e => startRotateTouch(e, draggable), { passive: false });

    const lockButton = createLockButton(draggable);
    draggable.appendChild(lockButton);
    lockButton.addEventListener("click", e => {
      e.stopPropagation();
      toggleLock(e, draggable, lockButton);
    });
    lockButton.addEventListener("touchend", e => {
      e.stopPropagation();
      toggleLock(e, draggable, lockButton);
    });
    lockButton.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        lockButton.click();
      }
    });

    draggable.addEventListener("mousedown", e => {
      if (!draggable.classList.contains("locked")) {
        selectElement(draggable);
        if (!e.target.classList.contains("resize-handle") && !e.target.classList.contains("rotate-handle"))
          startDrag(e, draggable);
      }
    });
    draggable.addEventListener("touchstart", e => {
      if (!draggable.classList.contains("locked")) {
        selectElement(draggable);
        if (!e.target.classList.contains("resize-handle") && !e.target.classList.contains("rotate-handle"))
          startDragTouch(e, draggable);
      }
    }, { passive: false });

    characterContainer.appendChild(draggable);
    selectElement(draggable);
    updateTransform(draggable);
  }

  function createLockButton(element) {
    const lockButton = document.createElement("button");
    lockButton.classList.add("lock-button");
    lockButton.innerHTML = "🔒";
    lockButton.setAttribute("aria-label", "Lock Element");
    return lockButton;
  }

  function toggleLock(e, element, lockButton) {
    e.stopPropagation();
    const isLocked = element.classList.toggle("locked");
    lockButton.innerHTML = isLocked ? "🔓" : "🔒";
    lockButton.setAttribute("aria-label", isLocked ? "Unlock Element" : "Lock Element");
  }

  function startDrag(e, element) {
    if (element.classList.contains("locked")) return;
    isDragging = true;
    selectElement(element);
    const rect = element.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    e.preventDefault();
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", stopDrag);
  }

  function handleDragMove(e) {
    if (!isDragging || isRotating || isResizing || !selectedElement || selectedElement.classList.contains("locked")) return;
    e.preventDefault();
    const containerRect = characterContainer.getBoundingClientRect();
    let newLeft = e.clientX - containerRect.left - dragOffsetX;
    let newTop = e.clientY - containerRect.top - dragOffsetY;
    newLeft = Math.max(0, Math.min(newLeft, containerRect.width - selectedElement.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, containerRect.height - selectedElement.offsetHeight));
    selectedElement.style.left = newLeft + "px";
    selectedElement.style.top = newTop + "px";
  }

  function stopDrag(e) {
    isDragging = false;
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", stopDrag);
  }

  function startDragTouch(e, element) {
    if (element.classList.contains("locked")) return;
    isDragging = true;
    selectElement(element);
    const rect = element.getBoundingClientRect();
    const touch = e.touches[0];
    dragOffsetX = touch.clientX - rect.left;
    dragOffsetY = touch.clientY - rect.top;
    e.preventDefault();
    document.addEventListener("touchmove", handleDragMoveTouch, { passive: false });
    document.addEventListener("touchend", stopDragTouch, { passive: false });
    document.addEventListener("touchcancel", stopDragTouch, { passive: false });
  }

  function handleDragMoveTouch(e) {
    if (!isDragging || isRotating || isResizing || !selectedElement || selectedElement.classList.contains("locked")) return;
    e.preventDefault();
    const touch = e.touches[0];
    const containerRect = characterContainer.getBoundingClientRect();
    let newLeft = touch.clientX - containerRect.left - dragOffsetX;
    let newTop = touch.clientY - containerRect.top - dragOffsetY;
    newLeft = Math.max(0, Math.min(newLeft, containerRect.width - selectedElement.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, containerRect.height - selectedElement.offsetHeight));
    selectedElement.style.left = newLeft + "px";
    selectedElement.style.top = newTop + "px";
  }

  function stopDragTouch(e) {
    isDragging = false;
    document.removeEventListener("touchmove", handleDragMoveTouch);
    document.removeEventListener("touchend", stopDragTouch);
    document.removeEventListener("touchcancel", stopDragTouch);
  }

  function startRotate(e, element) {
    if (element.classList.contains("locked")) return;
    isRotating = true;
    selectElement(element);
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    initialAngle = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
    initialRotation = parseFloat(element.dataset.rotation) || 0;
    e.preventDefault();
    document.addEventListener("mousemove", handleRotateMove);
    document.addEventListener("mouseup", stopRotate);
  }

  function handleRotateMove(e) {
    if (!isRotating || !selectedElement || selectedElement.classList.contains("locked")) return;
    e.preventDefault();
    const rect = selectedElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
    const deltaAngle = currentAngle - initialAngle;
    selectedElement.dataset.rotation = (initialRotation + deltaAngle).toString();
    updateTransform(selectedElement);
  }

  function stopRotate(e) {
    isRotating = false;
    document.removeEventListener("mousemove", handleRotateMove);
    document.removeEventListener("mouseup", stopRotate);
  }

  function startRotateTouch(e, element) {
    if (element.classList.contains("locked")) return;
    isRotating = true;
    selectElement(element);
    const rect = element.getBoundingClientRect();
    const touch = e.touches[0];
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    initialAngle = (Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * 180) / Math.PI;
    initialRotation = parseFloat(element.dataset.rotation) || 0;
    e.preventDefault();
    document.addEventListener("touchmove", handleRotateMoveTouch, { passive: false });
    document.addEventListener("touchend", stopRotateTouch, { passive: false });
    document.addEventListener("touchcancel", stopRotateTouch, { passive: false });
  }

  function handleRotateMoveTouch(e) {
    if (!isRotating || !selectedElement || selectedElement.classList.contains("locked")) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = selectedElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = (Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * 180) / Math.PI;
    const deltaAngle = currentAngle - initialAngle;
    selectedElement.dataset.rotation = (initialRotation + deltaAngle).toString();
    updateTransform(selectedElement);
  }

  function stopRotateTouch(e) {
    isRotating = false;
    document.removeEventListener("touchmove", handleRotateMoveTouch);
    document.removeEventListener("touchend", stopRotateTouch);
    document.removeEventListener("touchcancel", stopRotateTouch);
  }

  function startResize(e, element, handle) {
    if (element.classList.contains("locked")) return;
    isResizing = true;
    selectElement(element);
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeHandle = handle;
    resizeStartWidth = element.offsetWidth;
    resizeStartHeight = element.offsetHeight;
    e.preventDefault();
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", stopResize);
  }

  function handleResizeMove(e) {
    if (!isResizing || !selectedElement || selectedElement.classList.contains("locked")) return;
    e.preventDefault();
    let dx = e.clientX - resizeStartX;
    let dy = e.clientY - resizeStartY;
    let newWidth = resizeStartWidth;
    let newHeight = resizeStartHeight;
    switch (resizeHandle) {
      case "br": newWidth += dx; newHeight += dy; break;
      case "bl": newWidth -= dx; newHeight += dy; break;
      case "tr": newWidth += dx; newHeight -= dy; break;
      case "tl": newWidth -= dx; newHeight -= dy; break;
    }
    newWidth = Math.max(30, newWidth);
    newHeight = Math.max(30, newHeight);
    const naturalW = parseFloat(selectedElement.dataset.naturalWidth) || newWidth;
    const newScale = newWidth / naturalW;
    selectedElement.dataset.scale = newScale;
    selectedElement.style.width = newWidth + "px";
    selectedElement.style.height = newHeight + "px";
    updateTransform(selectedElement);
  }

  function stopResize(e) {
    isResizing = false;
    resizeHandle = null;
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", stopResize);
  }

  function startResizeTouch(e, element, handle) {
    if (element.classList.contains("locked")) return;
    isResizing = true;
    selectElement(element);
    const touch = e.touches[0];
    resizeStartX = touch.clientX;
    resizeStartY = touch.clientY;
    resizeHandle = handle;
    resizeStartWidth = element.offsetWidth;
    resizeStartHeight = element.offsetHeight;
    e.preventDefault();
    document.addEventListener("touchmove", handleResizeMoveTouch, { passive: false });
    document.addEventListener("touchend", stopResizeTouch, { passive: false });
    document.addEventListener("touchcancel", stopResizeTouch, { passive: false });
  }

  function handleResizeMoveTouch(e) {
    if (!isResizing || !selectedElement || selectedElement.classList.contains("locked")) return;
    e.preventDefault();
    const touch = e.touches[0];
    let dx = touch.clientX - resizeStartX;
    let dy = touch.clientY - resizeStartY;
    let newWidth = resizeStartWidth;
    let newHeight = resizeStartHeight;
    switch (resizeHandle) {
      case "br": newWidth += dx; newHeight += dy; break;
      case "bl": newWidth -= dx; newHeight += dy; break;
      case "tr": newWidth += dx; newHeight -= dy; break;
      case "tl": newWidth -= dx; newHeight -= dy; break;
    }
    newWidth = Math.max(30, newWidth);
    newHeight = Math.max(30, newHeight);
    const naturalW = parseFloat(selectedElement.dataset.naturalWidth) || newWidth;
    const newScale = newWidth / naturalW;
    selectedElement.dataset.scale = newScale;
    selectedElement.style.width = newWidth + "px";
    selectedElement.style.height = newHeight + "px";
    updateTransform(selectedElement);
  }

  function stopResizeTouch(e) {
    isResizing = false;
    resizeHandle = null;
    document.removeEventListener("touchmove", handleResizeMoveTouch);
    document.removeEventListener("touchend", stopResizeTouch);
    document.removeEventListener("touchcancel", stopResizeTouch);
  }

  function selectElement(element) {
    if (selectedElement && selectedElement !== element) {
      selectedElement.classList.remove("selected");
    }
    selectedElement = element;
    selectedElement.classList.add("selected");
    displayOptions(selectedElement.dataset.part);
    selectedPart = selectedElement.dataset.part;
  }

  function updateTransform(element) {
    const rotation = parseFloat(element.dataset.rotation) || 0;
    const flipX = (element.dataset.flipx === "true");
    const flipY = (element.dataset.flipy === "true");
    const imageContainer = element.querySelector("div");
    if (imageContainer) {
      let transformString = `rotate(${rotation}deg)`;
      if (flipX) transformString += " rotateY(180deg)";
      if (flipY) transformString += " rotateX(180deg)";
      imageContainer.style.transform = transformString;
    }
  }

  function applyColorToElement(element, color) {
    const part = element.dataset.part;
    if (["body", "eyes", "mouth"].includes(part)) return;
    const img = element.querySelector("img");
    if (!img) return;
    if (color === "reset") {
      element.dataset.color = "";
      img.style.filter = "none";
    } else {
      element.dataset.color = color;
      const hueDegrees = rgbToHueDegrees(color);
      if (hueDegrees !== null) {
        img.style.filter = `sepia(1) saturate(10000%) hue-rotate(${hueDegrees}deg)`;
      } else {
        img.style.filter = "none";
      }
    }
  }

  function applyBackgroundImage(option) {
    const imgSrc = `public/assets/v1/background/${option}.png`;
    if (option.startsWith("bg")) {
      characterContainer.style.backgroundImage = `url(${imgSrc})`;
      characterContainer.style.backgroundSize = "cover";
      characterContainer.style.backgroundPosition = "center";
      characterContainer.style.backgroundRepeat = "no-repeat";
      characterContainer.style.backgroundColor = "transparent";
    }
  }

  function applyBackgroundColor(color) {
    if (color === "reset") {
      characterContainer.style.backgroundColor = "#ffffff";
      characterContainer.style.backgroundImage = "none";
    } else {
      characterContainer.style.backgroundColor = color;
      characterContainer.style.backgroundImage = "none";
    }
  }

  function applyCustomBackground(imageUrl) {
    characterContainer.style.backgroundImage = `url(${imageUrl})`;
    characterContainer.style.backgroundSize = "cover";
    characterContainer.style.backgroundPosition = "center";
    characterContainer.style.backgroundRepeat = "no-repeat";
    characterContainer.style.backgroundColor = "transparent";
  }

  // --------------------------------------------------------------------
  // Sauvegarde sur canvas en "reconstruisant" le rendu (correction)
  // --------------------------------------------------------------------
  saveButton.addEventListener("click", () => {
    const containerRect = characterContainer.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    canvas.width = containerRect.width * ratio;
    canvas.height = containerRect.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);

    // Gérer le background
    if (characterContainer.style.backgroundImage && characterContainer.style.backgroundImage !== "none") {
      let bgUrl = characterContainer.style.backgroundImage;
      // Extraction de l'URL dans le format url("...")
      bgUrl = bgUrl.slice(bgUrl.indexOf('("') + 2, bgUrl.lastIndexOf('")'));
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = bgUrl;
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, containerRect.width, containerRect.height);
        drawElementsToCanvas(ctx, canvas);
      };
      bgImg.onerror = () => {
        ctx.fillStyle = characterContainer.style.backgroundColor || "#ffffff";
        ctx.fillRect(0, 0, containerRect.width, containerRect.height);
        drawElementsToCanvas(ctx, canvas);
      };
    } else {
      ctx.fillStyle = characterContainer.style.backgroundColor || "#ffffff";
      ctx.fillRect(0, 0, containerRect.width, containerRect.height);
      drawElementsToCanvas(ctx, canvas);
    }
  });

  function drawElementsToCanvas(ctx, canvas) {
    const elements = Array.from(characterContainer.querySelectorAll(".draggable"));
    // Tri par z-index croissant pour dessiner l'arrière-plan en premier
    elements.sort((a, b) => {
      return (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0);
    });
    const promises = elements.map(el => {
      return new Promise(resolve => {
        const img = el.querySelector("img");
        if (!img) {
          resolve();
          return;
        }
        const originalImg = new Image();
        originalImg.crossOrigin = "anonymous";
        originalImg.src = img.src;
        originalImg.onload = () => {
          drawSingleElement(ctx, el, originalImg);
          resolve();
        };
        originalImg.onerror = () => resolve();
      });
    });
    Promise.all(promises).then(() => {
      downloadCanvas(canvas);
    });
  }

  function drawSingleElement(ctx, element, img) {
    const x = parseFloat(element.style.left) || 0;
    const y = parseFloat(element.style.top) || 0;
    const w = element.offsetWidth;
    const h = element.offsetHeight;
    const rotation = parseFloat(element.dataset.rotation) || 0;
    const flipX = (element.dataset.flipx === "true");
    const flipY = (element.dataset.flipy === "true");

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    if (flipX) ctx.scale(-1, 1);
    if (flipY) ctx.scale(1, -1);
    const computedFilter = window.getComputedStyle(element.querySelector("img")).filter;
    ctx.filter = computedFilter && computedFilter !== "none" ? computedFilter : "none";
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
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

  function centerElement(element) {
    const containerRect = characterContainer.getBoundingClientRect();
    const elemWidth = element.offsetWidth;
    const elemHeight = element.offsetHeight;
    const left = (containerRect.width - elemWidth) / 2;
    const top = (containerRect.height - elemHeight) / 2;
    element.style.left = left + "px";
    element.style.top = top + "px";
  }

  function initializeBody() {
    addElement("body", "body1");
  }

  sidebarToggle.addEventListener("click", e => {
    e.stopPropagation();
    const isOpen = sidebar.classList.toggle("open");
    sidebarToggle.setAttribute("aria-expanded", isOpen);
    sidebarToggle.setAttribute("aria-label", isOpen ? "Close Sidebar" : "Open Sidebar");
    document.body.classList.toggle("no-scroll", isOpen);
  });

  closeSidebar.addEventListener("click", e => {
    e.stopPropagation();
    if (sidebar.classList.contains("open")) {
      sidebar.classList.remove("open");
      sidebarToggle.setAttribute("aria-expanded", "false");
      sidebarToggle.setAttribute("aria-label", "Open Sidebar");
      document.body.classList.remove("no-scroll");
    }
  });

  document.addEventListener("click", e => {
    if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
      if (sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        sidebarToggle.setAttribute("aria-expanded", "false");
        sidebarToggle.setAttribute("aria-label", "Open Sidebar");
        document.body.classList.remove("no-scroll");
      }
    }
  });

  selectionButtons.forEach(button => {
    button.addEventListener("click", e => {
      e.stopPropagation();
      const part = button.dataset.part;
      const isActive = button.classList.contains("active");
      if (isActive) {
        button.classList.remove("active");
        button.setAttribute("aria-expanded", "false");
        const dropdown = document.getElementById(`options-${part}`);
        if (dropdown) {
          dropdown.classList.remove("active");
          dropdown.setAttribute("aria-modal", "false");
          const colorSelection = dropdown.querySelector(".color-selection");
          if (colorSelection) colorSelection.style.display = "none";
        }
        selectedPart = null;
      } else {
        closeAllDropdowns();
        button.classList.add("active");
        button.setAttribute("aria-expanded", "true");
        const dropdown = document.getElementById(`options-${part}`);
        if (dropdown) {
          dropdown.classList.add("active");
          dropdown.setAttribute("aria-modal", "true");
          const colorSelection = dropdown.querySelector(".color-selection");
          if (colorSelection) colorSelection.style.display = "block";
        }
        selectedPart = part;
      }
    });
    button.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        button.click();
      }
    });
  });

  document.querySelectorAll(".close-button").forEach(closeBtn => {
    closeBtn.addEventListener("click", e => {
      e.stopPropagation();
      const dropdown = closeBtn.parentElement;
      dropdown.classList.remove("active");
      dropdown.setAttribute("aria-modal", "false");
      const part = dropdown.id.split("-")[1];
      const partButton = document.querySelector(`.part-button[data-part="${part}"]`);
      if (partButton) {
        partButton.classList.remove("active");
        partButton.setAttribute("aria-expanded", "false");
      }
      const colorSelection = dropdown.querySelector(".color-selection");
      if (colorSelection) colorSelection.style.display = "none";
      selectedPart = null;
    });
    closeBtn.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        closeBtn.click();
      }
    });
  });

  colorButtons.forEach(button => {
    button.addEventListener("click", e => {
      e.stopPropagation();
      applyColorButtonClick(button.dataset.color);
    });
    button.addEventListener("touchend", e => {
      e.preventDefault();
      applyColorButtonClick(button.dataset.color);
    });
    button.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        button.click();
      }
    });
  });

  function applyColorButtonClick(color) {
    if (!selectedPart) {
      console.log("Aucune partie sélectionnée. Couleur non appliquée.");
      return;
    }
    if (selectedPart === "background") {
      if (color === "reset") applyBackgroundColor("reset");
      else applyBackgroundColor(color);
      return;
    }
    if (!selectedElement) {
      console.log("Aucun élément sélectionné pour appliquer la couleur.");
      return;
    }
    if (color === "reset") applyColorToElement(selectedElement, "reset");
    else applyColorToElement(selectedElement, color);
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeAllDropdowns();
      if (sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        sidebarToggle.setAttribute("aria-expanded", "false");
        sidebarToggle.setAttribute("aria-label", "Open Sidebar");
        document.body.classList.remove("no-scroll");
      }
    }
  });

  deleteButton.addEventListener("click", () => {
    if (selectedElement && !selectedElement.classList.contains("locked")) {
      selectedElement.remove();
      selectedElement = null;
      selectedPart = null;
    }
  });

  flipHorizontalButton.addEventListener("click", () => {
    if (selectedElement && !selectedElement.classList.contains("locked")) {
      const currentFlipX = (selectedElement.dataset.flipx === "true");
      selectedElement.dataset.flipx = (!currentFlipX).toString();
      updateTransform(selectedElement);
    }
  });

  flipVerticalButton.addEventListener("click", () => {
    if (selectedElement && !selectedElement.classList.contains("locked")) {
      const currentFlipY = (selectedElement.dataset.flipy === "true");
      selectedElement.dataset.flipy = (!currentFlipY).toString();
      updateTransform(selectedElement);
    }
  });

  bringForwardButton.addEventListener("click", () => {
    if (selectedElement && !selectedElement.classList.contains("locked"))
      bringToFront(selectedElement);
  });

  sendBackwardButton.addEventListener("click", () => {
    if (selectedElement && !selectedElement.classList.contains("locked"))
      sendToBack(selectedElement);
  });

  versionButton.addEventListener("click", () => {
    window.location.href = "/public/v2/v2.html";
  });

  uploadButton.addEventListener("click", e => {
    e.stopPropagation();
    uploadInput.click();
  });

  uploadInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const imageUrl = event.target.result;
        applyCustomBackground(imageUrl);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Veuillez sélectionner un fichier image valide.");
    }
  });

  // Génération des options et initialisation
  generateDropdownOptions();
  initializeBody();
});