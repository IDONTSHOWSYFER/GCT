document.addEventListener("DOMContentLoaded", () => {
    // === Main Elements ===
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

    const colorButtons = document.querySelectorAll(".color-button"); // Color buttons within options-display

    const versionButton = document.getElementById("versionButton"); // "V2" Button

    // === Selectors for Custom Background Upload ===
    const uploadButton = document.querySelector(".upload-button");
    const uploadInput = document.getElementById("backgroundUploadInput");

    // === State Variables ===
    let selectedPart = null;
    let selectedElement = null;
    let selectedColors = {
        hair: null,
        accessories: null,
        hat: null,
        clothes: null,
        background: null
    };

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let animationFrameId;

    // Variables for Rotation and Resizing
    let isRotating = false;
    let initialAngle = 0;
    let initialRotation = 0;

    let isResizing = false;
    let resizeStartX = 0;
    let resizeStartY = 0;
    let resizeStartWidth = 0;
    let resizeStartHeight = 0;
    let resizeHandle = null;

    let initialResizeScale = 1;
    let initialResizeWidth = 0;
    let initialResizeHeight = 0;

    // === Utility Functions ===

    // Function to capitalize the first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Function to convert RGB or Hex to Hue Degrees for CSS Filters
    function rgbToHueDegrees(color) {
        let r, g, b;

        if (color.startsWith('#')) {
            // Convertir le format hexadécimal en RGB
            let hex = color.slice(1);
            if (hex.length === 3) {
                hex = hex.split('').map(char => char + char).join('');
            }
            const bigint = parseInt(hex, 16);
            r = (bigint >> 16) & 255;
            g = (bigint >> 8) & 255;
            b = bigint & 255;
        } else if (color.startsWith('rgb')) {
            // Extraire les valeurs RGB
            const rgbValues = color.match(/\d+/g).map(Number);
            if (rgbValues.length < 3) return null;
            [r, g, b] = rgbValues;
        } else {
            // Tenter de convertir tout autre format de couleur
            const dummy = document.createElement("div");
            dummy.style.color = color;
            document.body.appendChild(dummy);
            const computedColor = window.getComputedStyle(dummy).color;
            document.body.removeChild(dummy);
            const rgbMatch = computedColor.match(/\d+/g).map(Number);
            if (rgbMatch.length < 3) return null;
            [r, g, b] = rgbMatch;
        }

        console.log(`rgbToHueDegrees - Original color: ${color}, RGB: (${r}, ${g}, ${b})`);

        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        let hue = 0;

        if (max === min) {
            hue = 0;
        } else if (max === r) {
            hue = (60 * ((g - b) / (max - min)) + 360) % 360;
        } else if (max === g) {
            hue = (60 * ((b - r) / (max - min)) + 120) % 360;
        } else if (max === b) {
            hue = (60 * ((r - g) / (max - min)) + 240) % 360;
        }

        console.log(`rgbToHueDegrees - Computed hue: ${hue} degrees`);
        return hue;
    }

    // Function to get the maximum z-index in the canvas
    function getMaxZIndex() {
        let max = 0;
        characterContainer.querySelectorAll(".draggable").forEach((el) => {
            const z = parseInt(window.getComputedStyle(el).zIndex) || 0;
            if (z > max) max = z;
        });
        return max;
    }

    // Function to bring an element to the front
    function bringToFront(element) {
        element.style.zIndex = getMaxZIndex() + 1;
    }

    // Function to send an element to the back
    function sendToBack(element) {
        element.style.zIndex = Math.max(0, getMaxZIndex() - 1);
    }

    // Function to close all dropdowns
    function closeAllDropdowns() {
        document.querySelectorAll(".options-display").forEach((group) => {
            group.classList.remove("active");
            group.setAttribute("aria-modal", "false");
            const part = group.id.split("-")[1];
            const partButton = document.querySelector(
                `.part-button[data-part="${part}"]`
            );
            if (partButton) {
                partButton.classList.remove("active");
                partButton.setAttribute("aria-expanded", "false");
            }

            // Hide the corresponding color-selection div
            const colorSelection = group.querySelector(".color-selection");
            if (colorSelection) {
                colorSelection.style.display = "none";
            }
        });
        selectedPart = null;
    }

    // === Generate Dropdown Options ===

    function generateDropdownOptions() {
        const parts = {
            hair: [
                "hair1",
                "hair2",
                "hair3",
                "hair4",
                "hair5",
                "hair6",
                "hair7",
                "hair8",
                "hair9",
                "hair10",
            ],
            eyes: [
                "eyes1",
                "eyes2",
                "eyes3",
                "eyes4",
                "eyes5",
                "eyes6",
                "eyes7",
                "eyes8",
                "eyes9",
                "eyes10",
            ],
            mouth: [
                "mouth1",
                "mouth2",
                "mouth3",
                "mouth4",
                "mouth5",
                "mouth6",
                "mouth7",
                "mouth8",
                "mouth9",
                "mouth10",
            ],
            body: [
                "body1",
                "body2",
                "body3",
                "body4",
                "body5",
                "body6",
                "body7",
                "body8",
                "body9",
                "body10",
            ],
            accessories: [
                "accessory1",
                "accessory2",
                "accessory3",
                "accessory4",
                "accessory5",
                "accessory6",
                "accessory7",
                "accessory8",
                "accessory9",
                "accessory10",
            ],
            hat: [
                "hat1",
                "hat2",
                "hat3",
                "hat4",
                "hat5",
                "hat6",
                "hat7",
                "hat8",
                "hat9",
                "hat10",
            ],
            clothes: [
                "clothes1",
                "clothes2",
                "clothes3",
                "clothes4",
                "clothes5",
                "clothes6",
                "clothes7",
                "clothes8",
                "clothes9",
                "clothes10",
            ],
            background: [
                "bg1",
                "bg2",
                "bg3",
                "bg4",
                "bg5",
                "bg6",
                "bg7",
                "bg8",
                "bg9",
                "bg10",
            ],
        };

        for (const part in parts) {
            const optionsGroup = document.getElementById(`options-${part}`);
            if (optionsGroup) {
                const optionsGrid = optionsGroup.querySelector(".options-grid");
                if (!optionsGrid) {
                    console.error(`.options-grid not found in options-${part}`);
                    continue;
                }
                parts[part].forEach((option) => {
                    const button = document.createElement("button");
                    button.classList.add("option-button");
                    button.dataset.part = part;
                    button.dataset.option = option;
                    button.setAttribute(
                        "aria-label",
                        `${capitalizeFirstLetter(part)} Option ${option}`
                    );

                    // Create Image Inside the Button
                    const img = document.createElement("img");
                    img.src = `assets/avatar/${part}/${option}.png`;
                    img.alt = `${capitalizeFirstLetter(part)} ${option}`;

                    button.appendChild(img);

                    // Event Listener to Add the Element
                    button.addEventListener("click", (e) => {
                        e.stopPropagation();
                        addElement(part, option);
                        closeAllDropdowns();
                    });

                    // Accessibility: Activate via Keyboard
                    button.addEventListener("keydown", (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            button.click();
                        }
                    });

                    optionsGrid.appendChild(button);
                });
            }
        }
    }

    // === Function to Display Options and Color Selection ===

    function displayOptions(part) {
        if (!part) return;

        // Fermer les autres dropdowns
        document.querySelectorAll(".options-display").forEach((group) => {
            if (group.id !== `options-${part}`) {
                group.classList.remove("active");
                group.setAttribute("aria-modal", "false");
                const otherPart = group.id.split("-")[1];
                const partButton = document.querySelector(
                    `.part-button[data-part="${otherPart}"]`
                );
                if (partButton) {
                    partButton.classList.remove("active");
                    partButton.setAttribute("aria-expanded", "false");
                }

                // Masquer le div de sélection de couleur correspondant
                const colorSelection = group.querySelector(".color-selection");
                if (colorSelection) {
                    colorSelection.style.display = "none";
                }
            }
        });

        // Activer/désactiver le dropdown actuel
        const activeGroup = document.getElementById(`options-${part}`);
        if (activeGroup) {
            const isActive = activeGroup.classList.contains("active");
            activeGroup.classList.toggle("active", !isActive);
            activeGroup.setAttribute("aria-modal", !isActive);

            const partButton = document.querySelector(
                `.part-button[data-part="${part}"]`
            );
            if (partButton) {
                partButton.classList.toggle("active", !isActive);
                partButton.setAttribute("aria-expanded", !isActive);
            }

            // Afficher ou masquer la sélection de couleur en fonction de l'état actif
            const colorSelection = activeGroup.querySelector(".color-selection");
            if (colorSelection) {
                colorSelection.style.display = !isActive ? "block" : "none";
            }
        }
    }

    // === Function to Add a Draggable Element to the Canvas ===

    function addElement(part, option) {
        if (part === "background") {
            applyBackgroundImage(option);
            return;
        }

        const imgSrc = `assets/avatar/${part}/${option}.png`;

        const draggable = document.createElement("div");
        draggable.classList.add("draggable");
        draggable.dataset.part = part;
        draggable.dataset.option = option;
        draggable.dataset.rotation = "0";
        draggable.dataset.scale = "1"; // Initial scale
        draggable.dataset.scaleX = "1"; // Initial scaleX
        draggable.dataset.scaleY = "1"; // Initial scaleY

        // Initial Position and Styles
        draggable.style.left = "0px";
        draggable.style.top = "0px";
        draggable.style.transform = `rotate(0deg) scale(1) scale(1, 1)`;
        draggable.style.width = "100px";
        draggable.style.height = "100px";
        draggable.style.zIndex = getMaxZIndex() + 1;

        // Create Image Element
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = `${capitalizeFirstLetter(part)} ${option}`;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.pointerEvents = "none";
        img.onerror = () => {
            img.src = `assets/avatar/${part}/default.png`; // Default image in case of error
            console.log(`Erreur de chargement de l'image: ${imgSrc}. Utilisation de l'image par défaut.`);
        };
        draggable.appendChild(img);

        // Apply Selected Color if Applicable
        if (["hair", "accessories", "hat", "clothes"].includes(part)) {
            const color = getDefaultColor(part);
            if (color) {
                applyColorToElement(draggable, color);
            }
        }

        // Add Resizing Handles
        const handles = ["br", "bl", "tr", "tl"];
        handles.forEach((handle) => {
            const resizeHandle = document.createElement("div");
            resizeHandle.classList.add("resize-handle", handle);
            resizeHandle.setAttribute("aria-label", `Resize Handle ${handle}`);
            draggable.appendChild(resizeHandle);

            // Event Listeners for Resizing
            resizeHandle.addEventListener("mousedown", (e) =>
                startResize(e, draggable, handle)
            );
            resizeHandle.addEventListener(
                "touchstart",
                (e) => startResize(e, draggable, handle),
                { passive: false }
            );
        });

        // Add Rotation Handle
        const rotateHandle = document.createElement("div");
        rotateHandle.classList.add("rotate-handle");
        rotateHandle.setAttribute("aria-label", "Rotate Handle");
        draggable.appendChild(rotateHandle);

        // Event Listeners for Rotation
        rotateHandle.addEventListener("mousedown", (e) =>
            startRotate(e, draggable)
        );
        rotateHandle.addEventListener(
            "touchstart",
            (e) => startRotate(e, draggable),
            { passive: false }
        );

        // Add Lock Button
        const lockButton = createLockButton(draggable);
        draggable.appendChild(lockButton);

        // Event Listeners for Locking
        lockButton.addEventListener("click", (e) =>
            toggleLock(e, draggable, lockButton)
        );
        lockButton.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                lockButton.click();
            }
        });

        // Make the Element Draggable
        makeDraggable(draggable);

        // Add to Canvas
        characterContainer.appendChild(draggable);
    }

    // === Function to Get Default Color for a Part ===

    function getDefaultColor(part) {
        return selectedColors[part] || null;
    }

    // === Function to Create the Lock Button ===

    function createLockButton(element) {
        const lockButton = document.createElement("button");
        lockButton.classList.add("lock-button");
        lockButton.innerHTML = "🔒";
        lockButton.setAttribute("aria-label", "Lock Element");
        return lockButton;
    }

    // === Function to Toggle Lock/Unlock ===

    function toggleLock(e, element, lockButton) {
        e.stopPropagation();
        const isLocked = element.classList.toggle("locked");
        lockButton.innerHTML = isLocked ? "🔓" : "🔒";
        lockButton.setAttribute(
            "aria-label",
            isLocked ? "Unlock Element" : "Lock Element"
        );
        console.log(`Élément ${isLocked ? "verrouillé" : "déverrouillé"}.`);
    }

    // === Function to Make Element Draggable ===

    function makeDraggable(element) {
        element.addEventListener("mousedown", (e) => startDrag(e, element));
        element.addEventListener("touchstart", (e) => startDrag(e, element), {
            passive: false,
        });
    }

    // === Function to Start Dragging ===

    function startDrag(e, element) {
        if (element.classList.contains("locked")) {
            return; // Do not allow dragging if the element is locked
        }

        isDragging = true;
        selectedElement = element;
        selectElement(element);

        const rect = element.getBoundingClientRect();
        const containerRect = characterContainer.getBoundingClientRect();

        // Calculate offsets for movement
        if (e.type === "touchstart") {
            dragOffsetX = e.touches[0].clientX - rect.left;
            dragOffsetY = e.touches[0].clientY - rect.top;
        } else {
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
        }

        document.addEventListener("mousemove", handleDragMove);
        document.addEventListener("mouseup", stopDrag);
        document.addEventListener("touchmove", handleDragMove, { passive: false });
        document.addEventListener("touchend", stopDrag, { passive: false });
    }

    // === Function to Handle Dragging ===

    function handleDragMove(e) {
        // Prevent dragging if resizing or rotating is in progress
        if (
            !isDragging ||
            isRotating ||
            isResizing ||
            !selectedElement ||
            selectedElement.classList.contains("locked")
        )
            return;

        e.preventDefault();

        let clientX, clientY;
        if (e.type === "touchmove") {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const containerRect = characterContainer.getBoundingClientRect();
        let newLeft = clientX - containerRect.left - dragOffsetX;
        let newTop = clientY - containerRect.top - dragOffsetY;

        // Constrain the element within the canvas
        newLeft = Math.max(
            0,
            Math.min(newLeft, containerRect.width - selectedElement.offsetWidth)
        );
        newTop = Math.max(
            0,
            Math.min(newTop, containerRect.height - selectedElement.offsetHeight)
        );

        // Update positions without interfering with transformations
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(() => {
            selectedElement.style.left = `${newLeft}px`;
            selectedElement.style.top = `${newTop}px`;
        });
    }

    // === Function to Stop Dragging ===

    function stopDrag() {
        isDragging = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", stopDrag);
        document.removeEventListener("touchmove", handleDragMove, { passive: false });
        document.removeEventListener("touchend", stopDrag, { passive: false });
    }

    // === Function to Start Rotating ===

    function startRotate(e, element) {
        if (element.classList.contains("locked")) return;

        isRotating = true;
        selectedElement = element;
        selectElement(element);

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        if (e.type === "touchstart") {
            initialAngle =
                (Math.atan2(
                    e.touches[0].clientY - centerY,
                    e.touches[0].clientX - centerX
                ) *
                    180) /
                Math.PI;
        } else {
            initialAngle =
                (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) /
                Math.PI;
        }
        initialRotation = parseFloat(element.dataset.rotation) || 0;

        document.addEventListener("mousemove", handleRotateMove);
        document.addEventListener("mouseup", stopRotate);
        document.addEventListener("touchmove", handleRotateMove, {
            passive: false,
        });
        document.addEventListener("touchend", stopRotate, { passive: false });
    }

    // === Function to Handle Rotation ===

    function handleRotateMove(e) {
        if (
            !isRotating ||
            !selectedElement ||
            selectedElement.classList.contains("locked")
        )
            return;

        e.preventDefault();

        let clientX, clientY;
        if (e.type === "touchmove") {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const rect = selectedElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const currentAngle =
            (Math.atan2(clientY - centerY, clientX - centerX) * 180) /
            Math.PI;
        const deltaAngle = currentAngle - initialAngle;

        selectedElement.dataset.rotation = (initialRotation + deltaAngle).toString();
        updateTransform(selectedElement);
    }

    // === Function to Update Transformations ===

    function updateTransform(element) {
        const rotation = parseFloat(element.dataset.rotation) || 0;
        const scale = parseFloat(element.dataset.scale) || 1;
        const scaleX = parseFloat(element.dataset.scaleX) || 1;
        const scaleY = parseFloat(element.dataset.scaleY) || 1;

        // Appliquer la rotation, puis la mise à l'échelle générale, puis la mise à l'échelle spécifique (flip)
        const currentTransform = `rotate(${rotation}deg) scale(${scale * scaleX}, ${scale * scaleY})`;
        element.style.transform = currentTransform;
    }

    // === Function to Stop Rotating ===

    function stopRotate() {
        isRotating = false;
        document.removeEventListener("mousemove", handleRotateMove);
        document.removeEventListener("mouseup", stopRotate);
        document.removeEventListener("touchmove", handleRotateMove, {
            passive: false,
        });
        document.removeEventListener("touchend", stopRotate, { passive: false });
    }

    // === Function to Start Resizing ===

    function startResize(e, element, handle) {
        if (element.classList.contains("locked")) return;

        isResizing = true;
        selectedElement = element;
        selectElement(element);

        const rect = element.getBoundingClientRect();

        if (e.type === "touchstart") {
            resizeStartX = e.touches[0].clientX;
            resizeStartY = e.touches[0].clientY;
        } else {
            resizeStartX = e.clientX;
            resizeStartY = e.clientY;
        }
        resizeHandle = handle;
        resizeStartWidth = element.offsetWidth;
        resizeStartHeight = element.offsetHeight;

        // Stocker l'échelle et les dimensions initiales
        initialResizeScale = parseFloat(element.dataset.scale) || 1;
        initialResizeWidth = element.offsetWidth;
        initialResizeHeight = element.offsetHeight;

        document.addEventListener("mousemove", handleResizeMove);
        document.addEventListener("mouseup", stopResize);
        document.addEventListener("touchmove", handleResizeMove, {
            passive: false,
        });
        document.addEventListener("touchend", stopResize, { passive: false });
    }

    // === Function to Handle Resizing ===

    function handleResizeMove(e) {
        if (
            !isResizing ||
            !selectedElement ||
            selectedElement.classList.contains("locked")
        )
            return;

        e.preventDefault();

        let clientX, clientY;
        if (e.type === "touchmove") {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        let dx = clientX - resizeStartX;
        let dy = clientY - resizeStartY;

        let newWidth = resizeStartWidth;
        let newHeight = resizeStartHeight;

        switch (resizeHandle) {
            case "br":
                newWidth += dx;
                newHeight += dy;
                break;
            case "bl":
                newWidth -= dx;
                newHeight += dy;
                break;
            case "tr":
                newWidth += dx;
                newHeight -= dy;
                break;
            case "tl":
                newWidth -= dx;
                newHeight -= dy;
                break;
            default:
                break;
        }

        newWidth = Math.max(30, newWidth);
        newHeight = Math.max(30, newHeight);

        // Calculer la nouvelle échelle basée sur l'état initial
        let newScale = initialResizeScale * (newWidth / initialResizeWidth);

        // Limiter la scale pour éviter des redimensionnements excessifs
        newScale = Math.max(0.2, Math.min(newScale, 10)); // Permet une échelle entre 20% et 1000%

        // Appliquer la nouvelle échelle
        selectedElement.dataset.scale = newScale.toString();
        updateTransform(selectedElement);
    }

    // === Function to Stop Resizing ===

    function stopResize() {
        isResizing = false;
        resizeHandle = null;
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", stopResize);
        document.removeEventListener("touchmove", handleResizeMove, {
            passive: false,
        });
        document.removeEventListener("touchend", stopResize, { passive: false });
    }

    // === Function to Select an Element ===

    function selectElement(element) {
        if (selectedElement && selectedElement !== element) {
            selectedElement.classList.remove("selected");
        }

        selectedElement = element;
        selectedElement.classList.add("selected");

        document.querySelectorAll(".draggable").forEach((el) => {
            if (el !== selectedElement) {
                el.classList.remove("selected");
            }
        });

        displayOptions(selectedElement.dataset.part);
        selectedPart = selectedElement.dataset.part; // Mise à jour de selectedPart
        console.log(`Élément sélectionné: ${selectedPart}`);
    }

    // === Function to Apply Color to an Element ===

    function applyColorToElement(element, color) {
        const part = element.dataset.part;

        // Exclure body, mouth, et eyes
        if (["body", "eyes", "mouth"].includes(part)) {
            return; // Pas d'application de couleur pour ces parties
        }

        const img = element.querySelector("img");
        if (!img) return;

        if (color === "reset") {
            element.dataset.color = null;
            img.style.filter = "none";
            console.log(`Réinitialisation de la couleur de ${part}.`);
        } else {
            element.dataset.color = color;
            const hueDegrees = rgbToHueDegrees(color);
            if (hueDegrees !== null) {
                img.style.filter = `sepia(1) saturate(10000%) hue-rotate(${hueDegrees}deg)`;
                console.log(`Application de la couleur ${color} à ${part} (Hue: ${hueDegrees}°).`);
            } else {
                img.style.filter = "none";
                console.log(`Impossible de calculer la teinte pour la couleur ${color}.`);
            }
        }
    }

    // === Function to Apply Background Image ===

    function applyBackgroundImage(option) {
        const imgSrc = `assets/avatar/background/${option}.png`;

        if (option.startsWith("bg")) {
            characterContainer.style.backgroundImage = `url(${imgSrc})`;
            characterContainer.style.backgroundSize = "cover";
            characterContainer.style.backgroundPosition = "center";
            characterContainer.style.backgroundRepeat = "no-repeat";
            characterContainer.style.backgroundColor = "transparent"; // Assurez-vous que la couleur de fond est transparente
            selectedColors.background = null; // Disable background color if an image is selected
            console.log(`Image de fond appliquée: ${imgSrc}`);
        }
    }

    // === Function to Apply Background Color ===

    function applyBackgroundColor(color) {
        if (color === "reset") {
            characterContainer.style.backgroundColor = "#ffffff";
            characterContainer.style.backgroundImage = "none";
            selectedColors.background = null;
            console.log("Réinitialisation de la couleur de fond.");
        } else {
            characterContainer.style.backgroundColor = color;
            characterContainer.style.backgroundImage = "none";
            selectedColors.background = color;
            console.log(`Couleur de fond appliquée: ${color}`);
        }
    }

    // === Function to Apply Custom Background Image ===

    function applyCustomBackground(imageUrl) {
        characterContainer.style.backgroundImage = `url(${imageUrl})`;
        characterContainer.style.backgroundSize = "cover";
        characterContainer.style.backgroundPosition = "center";
        characterContainer.style.backgroundRepeat = "no-repeat";
        characterContainer.style.backgroundColor = "transparent"; // Ajouté pour s'assurer que la couleur de fond n'interfère pas
        selectedColors.background = null; // Désactiver la sélection de couleur si une image est choisie
        console.log(`Fond personnalisé appliqué: ${imageUrl}`);
    }

    // === Function to Handle Saving the Avatar ===

    saveButton.addEventListener("click", () => {
        const tempCanvas = document.createElement("canvas");
        const containerRect = characterContainer.getBoundingClientRect();
        tempCanvas.width = containerRect.width;
        tempCanvas.height = containerRect.height;
        adjustCanvasForRetina(tempCanvas); // Appliquer l'ajustement pour retina
        const ctx = tempCanvas.getContext("2d");

        const bgImage = characterContainer.style.backgroundImage;
        if (bgImage && bgImage !== "none") {
            const bgUrl = bgImage.slice(5, -2); // Extraire l'URL
            const bgImg = new Image();
            bgImg.src = bgUrl;
            bgImg.crossOrigin = "anonymous"; // Pour éviter les problèmes CORS
            bgImg.onload = () => {
                ctx.drawImage(bgImg, 0, 0, tempCanvas.width / (window.devicePixelRatio || 1), tempCanvas.height / (window.devicePixelRatio || 1));
                drawElements(ctx, tempCanvas.width / (window.devicePixelRatio || 1), tempCanvas.height / (window.devicePixelRatio || 1));
            };
            bgImg.onerror = () => {
                ctx.fillStyle = characterContainer.style.backgroundColor || "#ffffff";
                ctx.fillRect(0, 0, tempCanvas.width / (window.devicePixelRatio || 1), tempCanvas.height / (window.devicePixelRatio || 1));
                drawElements(ctx, tempCanvas.width / (window.devicePixelRatio || 1), tempCanvas.height / (window.devicePixelRatio || 1));
            };
        } else {
            ctx.fillStyle = characterContainer.style.backgroundColor || "#ffffff";
            ctx.fillRect(0, 0, tempCanvas.width / (window.devicePixelRatio || 1), tempCanvas.height / (window.devicePixelRatio || 1));
            drawElements(ctx, tempCanvas.width / (window.devicePixelRatio || 1), tempCanvas.height / (window.devicePixelRatio || 1));
        }

        function drawElements(ctx, canvasWidth, canvasHeight) {
            const elements = Array.from(characterContainer.querySelectorAll(".draggable"));

            // Trier les éléments par z-index
            elements.sort((a, b) => {
                return (
                    (parseInt(window.getComputedStyle(a).zIndex) || 0) -
                    (parseInt(window.getComputedStyle(b).zIndex) || 0)
                );
            });

            let loadedImages = 0;
            const totalImages = elements.length;

            if (totalImages === 0) {
                downloadCanvas(tempCanvas);
                return;
            }

            elements.forEach((el) => {
                const imgElement = el.querySelector("img");
                if (!imgElement) {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        downloadCanvas(tempCanvas);
                    }
                    return;
                }

                const img = new Image();
                img.src = imgElement.src;
                img.crossOrigin = "anonymous"; // Pour éviter les problèmes CORS
                img.onload = () => {
                    const left = el.offsetLeft;
                    const top = el.offsetTop;
                    const width = el.offsetWidth;
                    const height = el.offsetHeight;

                    const rotation = parseFloat(el.dataset.rotation) || 0;
                    const scale = parseFloat(el.dataset.scale) || 1;
                    const scaleX = parseFloat(el.dataset.scaleX) || 1;
                    const scaleY = parseFloat(el.dataset.scaleY) || 1;

                    const color = el.dataset.color || null;
                    const part = el.dataset.part;

                    ctx.save();

                    // Appliquer les transformations
                    ctx.translate(left + width / 2, top + height / 2);
                    ctx.rotate((rotation * Math.PI) / 180);
                    ctx.scale(scale * scaleX, scale * scaleY); // Combiner les échelles

                    // Appliquer les filtres de couleur si applicable
                    if (
                        color &&
                        ["clothes", "hat", "accessories", "hair"].includes(part)
                    ) {
                        const hueDegrees = rgbToHueDegrees(color);
                        console.log(`Part: ${part}, Hue Degrees: ${hueDegrees}`);
                        if (hueDegrees !== null) {
                            ctx.filter = `sepia(1) saturate(10000%) hue-rotate(${hueDegrees}deg)`;
                            console.log(`Applied filter: sepia(1) saturate(10000%) hue-rotate(${hueDegrees}deg)`);
                        } else {
                            ctx.filter = "none";
                            console.log(`No valid hueDegrees. Applied filter: none`);
                        }
                    } else {
                        ctx.filter = "none";
                        console.log(`No color to apply for part: ${part}. Applied filter: none`);
                    }

                    // Dessiner l'image en conservant les proportions
                    ctx.drawImage(img, -width / 2, -height / 2, width, height);

                    ctx.restore();

                    loadedImages++;
                    if (loadedImages === totalImages) {
                        downloadCanvas(tempCanvas);
                    }
                };
                img.onerror = () => {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        downloadCanvas(tempCanvas);
                    }
                };
            });
        }

        // === Fonction pour Télécharger le Canvas en Image ===

        function downloadCanvas(canvas) {
            const dataURL = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = dataURL;
            link.download = "avatar.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log("Avatar sauvegardé avec succès.");
        }
    });

    // === Function to Adjust Canvas for Retina Displays ===

    function adjustCanvasForRetina(canvas) {
        const ctx = canvas.getContext('2d');
        const ratio = window.devicePixelRatio || 1;
        const width = canvas.width;
        const height = canvas.height;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(ratio, ratio);
    }

    // === Function to Initialize Body Element ===

    function initializeBody() {
        addElement("body", "body1");
    }

    // === Event Listeners for Sidebar Toggle ===

    sidebarToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = sidebar.classList.toggle("open");
        sidebarToggle.setAttribute("aria-expanded", isOpen);
        sidebarToggle.setAttribute(
            "aria-label",
            isOpen ? "Close Sidebar" : "Open Sidebar"
        );

        // Ajouter ou supprimer la classe 'no-scroll' sur le body
        if (isOpen) {
            document.body.classList.add("no-scroll");
        } else {
            document.body.classList.remove("no-scroll");
        }
    });

    // === Event Listener for Close Sidebar Button ===

    closeSidebar.addEventListener("click", (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains("open")) {
            sidebar.classList.remove("open");
            sidebarToggle.setAttribute("aria-expanded", "false");
            sidebarToggle.setAttribute("aria-label", "Open Sidebar");

            // Supprimer la classe 'no-scroll' du body
            document.body.classList.remove("no-scroll");
        }
    });

    // === Close Sidebar if User Clicks Outside ===

    document.addEventListener("click", (e) => {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
            if (sidebar.classList.contains("open")) {
                sidebar.classList.remove("open");
                sidebarToggle.setAttribute("aria-expanded", "false");
                sidebarToggle.setAttribute("aria-label", "Open Sidebar");

                // Supprimer la classe 'no-scroll' du body
                document.body.classList.remove("no-scroll");
            }
        }
    });

    // === Event Listeners for Part Buttons ===

    selectionButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.stopPropagation(); // Empêche le déclenchement du clic sur le document

            const part = button.dataset.part;
            const isActive = button.classList.contains("active");

            // Basculer l'état actif
            if (isActive) {
                button.classList.remove("active");
                button.setAttribute("aria-expanded", "false");
                const dropdown = document.getElementById(`options-${part}`);
                if (dropdown) {
                    dropdown.classList.remove("active");
                    dropdown.setAttribute("aria-modal", "false");
                }

                // Masquer le div de sélection de couleur correspondant
                const colorSelection = dropdown.querySelector(".color-selection");
                if (colorSelection) {
                    colorSelection.style.display = "none";
                }

                selectedPart = null;
                console.log(`Partie désélectionnée: ${part}`);
            } else {
                // Fermer les autres dropdowns
                closeAllDropdowns();

                // Activer ce bouton
                button.classList.add("active");
                button.setAttribute("aria-expanded", "true");
                const dropdown = document.getElementById(`options-${part}`);
                if (dropdown) {
                    dropdown.classList.add("active");
                    dropdown.setAttribute("aria-modal", "true");
                }

                // Afficher le div de sélection de couleur correspondant
                const colorSelection = dropdown.querySelector(".color-selection");
                if (colorSelection) {
                    colorSelection.style.display = "block";
                }

                selectedPart = part;
                console.log(`Partie sélectionnée via la barre latérale: ${part}`);
            }
        });

        // Accessibilité : Activation via le clavier
        button.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                button.click();
            }
        });
    });

    // === Event Listeners for Close Buttons in Dropdowns ===

    document.querySelectorAll(".close-button").forEach((closeBtn) => {
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Empêche le déclenchement du clic sur le document
            const dropdown = closeBtn.parentElement;
            dropdown.classList.remove("active");
            dropdown.setAttribute("aria-modal", "false");
            const part = dropdown.id.split("-")[1];
            const partButton = document.querySelector(
                `.part-button[data-part="${part}"]`
            );
            if (partButton) {
                partButton.classList.remove("active");
                partButton.setAttribute("aria-expanded", "false");
            }

            // Masquer le div de sélection de couleur correspondant
            const colorSelection = dropdown.querySelector(".color-selection");
            if (colorSelection) {
                colorSelection.style.display = "none";
            }

            selectedPart = null;
            console.log(`Dropdown fermé pour la partie: ${part}`);
        });

        // Accessibilité : Fermer via le clavier
        closeBtn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                closeBtn.click();
            }
        });
    });

    // === Event Listeners for Color Buttons ===

    colorButtons.forEach((button) => {
        // Gestion des clics classiques
        button.addEventListener("click", (e) => {
            e.stopPropagation(); // Empêche le déclenchement du clic sur le document
            applyColorButtonClick(e, button);
        });

        // Gestion des taps tactiles
        button.addEventListener("touchend", (e) => {
            e.preventDefault(); // Empêche le défilement lors du tap
            applyColorButtonClick(e, button);
        });

        // Accessibilité : Activation via le clavier
        button.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                button.click();
            }
        });
    });

    function applyColorButtonClick(e, button) {
        const color = button.dataset.color;
        const part = selectedPart;

        console.log(`Bouton de couleur cliqué: ${color}, Partie sélectionnée: ${part}`);

        if (!part) {
            console.log("Aucune partie sélectionnée. La couleur n'a pas été appliquée.");
            return;
        }

        if (color === "reset") {
            if (part === "background") {
                applyBackgroundColor("reset");
                console.log(`Réinitialisation de la couleur du background.`);
            } else {
                selectedColors[part] = null;
                applyColorToPart(part, "reset");
                console.log(`Réinitialisation de la couleur de ${part}.`);
            }
        } else {
            if (part === "background") {
                applyBackgroundColor(color);
                console.log(`Application de la couleur ${color} au background.`);
            } else {
                selectedColors[part] = color;
                applyColorToPart(part, color);
                console.log(`Application de la couleur ${color} à ${part}.`);
            }
        }
    }

    // === Function to Apply Color to All Elements of a Part ===

    function applyColorToPart(part, color) {
        const elements = characterContainer.querySelectorAll(
            `.draggable[data-part="${part}"]`
        );
        elements.forEach((el) => {
            applyColorToElement(el, color);
        });
    }

    // === Function to Initialize ===

    // Generate dropdown options and initialize body on load
    generateDropdownOptions();
    initializeBody();

    // === Accessibility: Close Dropdowns with Escape Key ===

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeAllDropdowns();
            // Optionally: Close sidebar when Escape is pressed
            if (sidebar.classList.contains("open")) {
                sidebar.classList.remove("open");
                sidebarToggle.setAttribute("aria-expanded", "false");
                sidebarToggle.setAttribute("aria-label", "Open Sidebar");

                // Supprimer la classe 'no-scroll' du body
                document.body.classList.remove("no-scroll");
            }
        }
    });

    // === Event Listener for Delete Button ===

    deleteButton.addEventListener("click", () => {
        if (selectedElement && !selectedElement.classList.contains("locked")) {
            selectedElement.remove();
            selectedElement = null;
            selectedPart = null;
            console.log("Élément supprimé.");
        }
    });

    // === Event Listeners for Flip Buttons ===

    // Flip Horizontally
    flipHorizontalButton.addEventListener("click", () => {
        if (selectedElement && !selectedElement.classList.contains("locked")) {
            const currentScaleX = selectedElement.dataset.scaleX
                ? parseFloat(selectedElement.dataset.scaleX)
                : 1;
            selectedElement.dataset.scaleX = (-currentScaleX).toString(); // Inverser l'échelle X
            updateTransform(selectedElement);
            console.log("Flip horizontal appliqué.");
        }
    });

    // Flip Vertically
    flipVerticalButton.addEventListener("click", () => {
        if (selectedElement && !selectedElement.classList.contains("locked")) {
            const currentScaleY = selectedElement.dataset.scaleY
                ? parseFloat(selectedElement.dataset.scaleY)
                : 1;
            selectedElement.dataset.scaleY = (-currentScaleY).toString(); // Inverser l'échelle Y
            updateTransform(selectedElement);
            console.log("Flip vertical appliqué.");
        }
    });

    // === Event Listeners for Z-Index Buttons ===

    // Bring Forward
    bringForwardButton.addEventListener("click", () => {
        if (selectedElement && !selectedElement.classList.contains("locked")) {
            bringToFront(selectedElement);
            console.log("Élément mis au premier plan.");
        }
    });

    // Send Backward
    sendBackwardButton.addEventListener("click", () => {
        if (selectedElement && !selectedElement.classList.contains("locked")) {
            sendToBack(selectedElement);
            console.log("Élément envoyé en arrière-plan.");
        }
    });

    // === Event Listener for Version Button ("V2") ===

    versionButton.addEventListener("click", () => {
        window.location.href = "index-v2.html";
    });

    // === Intégration de la Fonctionnalité de Téléchargement d'Image de Fond Personnalisée ===

    // Event Listener pour le bouton d'upload
    uploadButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Empêche le déclenchement du clic sur le document
        uploadInput.click(); // Déclenche le clic sur l'input file
    });

    // Event Listener pour le changement de l'input file
    uploadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageUrl = event.target.result;
                applyCustomBackground(imageUrl);
            };
            reader.readAsDataURL(file);
        } else {
            alert("Veuillez sélectionner un fichier image valide.");
        }
    });

    // Accessibilité : Activation via le clavier pour le bouton d'upload
    uploadButton.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            uploadButton.click();
        }
    });

});

// === Function to Adjust Canvas for Retina Displays ===

function adjustCanvasForRetina(canvas) {
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.width;
    const height = canvas.height;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(ratio, ratio);
}

// === Function to Initialize Body Element ===

function initializeBody() {
    addElement("body", "body1");
}