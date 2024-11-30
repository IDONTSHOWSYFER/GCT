// js/script.js

document.addEventListener("DOMContentLoaded", () => {
    // Sélecteurs des éléments du DOM
    const characterContainer = document.getElementById("characterContainer");
    const partButtons = document.querySelectorAll(".part-button");
    const optionButtons = document.querySelectorAll(".option-button");
    const colorButtons = document.querySelectorAll(".color-button");
    const optionsDisplay = document.getElementById("optionsDisplay");
    const colorSelection = document.getElementById("colorSelection");

    const saveButton = document.getElementById("saveButton");
    const deleteButton = document.getElementById("deleteButton");
    const flipHorizontalButton = document.getElementById("flipHorizontalButton");
    const flipVerticalButton = document.getElementById("flipVerticalButton");
    const bringForwardButton = document.getElementById("bringForwardButton");
    const sendBackwardButton = document.getElementById("sendBackwardButton");
    const versionButton = document.getElementById("versionButton"); // Bouton V2

    let selectedPart = null;
    let selectedColor = null;
    let selectedElement = null;

    // Variables pour la gestion du drag et drop
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let animationFrameId;

    // Définir un facteur d'échelle pour augmenter la résolution du canvas
    const scalingFactor = 2;

    // Fonction de debounce pour limiter la fréquence des appels
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    // Fonction pour afficher les options en fonction de la partie sélectionnée
    function displayOptions(part) {
        console.log(`Displaying options for: ${part}`);
        // Masquer tous les groupes d'options
        document.querySelectorAll(".options-group").forEach((group) => {
            group.style.display = "none";
        });

        // Afficher le groupe d'options sélectionné
        const selectedGroup = document.getElementById(`options-${part}`);
        if (selectedGroup) {
            selectedGroup.style.display = "block";
            console.log(`Options displayed for: ${part}`);
        } else {
            console.warn(`No options group found for: ${part}`);
        }

        // Afficher ou masquer la sélection de couleur en fonction de la partie
        if (part === "body" || part === "eyes" || part === "mouth") {
            colorSelection.style.display = "none";
            console.log("Color selection hidden");
        } else {
            colorSelection.style.display = "block";
            console.log("Color selection displayed");
        }

        // Activer l'affichage des options
        optionsDisplay.classList.add("active");
    }

    // Fonction pour ajouter un élément au container
    function addElement(part, option) {
        const imgSrc = `assets/avatar/${part}/${option}.png`;

        // Créer le conteneur draggable
        const draggable = document.createElement("div");
        draggable.classList.add("draggable");
        draggable.dataset.part = part;
        draggable.dataset.option = option;
        draggable.style.left = "30%";
        draggable.style.top = "30%";
        draggable.style.transform = "translate(0%, 0%) rotate(0deg) scale(1)";
        draggable.style.width = "100px"; // Taille par défaut en pixels
        draggable.style.height = "100px"; // Taille par défaut en pixels
        draggable.style.zIndex = getMaxZIndex() + 1;

        // Créer l'image et l'ajouter au conteneur
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = `${part} ${option}`;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.pointerEvents = "none";
        draggable.appendChild(img);

        // Ajouter des poignées de redimensionnement
        const handles = ["br", "bl", "tr", "tl"];
        handles.forEach((handle) => {
            const resizeHandle = document.createElement("div");
            resizeHandle.classList.add("resize-handle", handle);
            draggable.appendChild(resizeHandle);
        });

        // Ajouter une poignée de rotation
        const rotateHandle = document.createElement("div");
        rotateHandle.classList.add("rotate-handle");
        draggable.appendChild(rotateHandle);

        // Ajouter un bouton de verrouillage
        const lockButton = document.createElement("button");
        lockButton.classList.add("lock-button");
        lockButton.innerHTML = "🔒"; // Icône de cadenas fermé
        draggable.appendChild(lockButton);

        // Initialiser les propriétés de transformation
        draggable.dataset.rotation = "0";
        draggable.dataset.scaleX = "1";
        draggable.dataset.scaleY = "1";

        // Ajouter l'élément au container
        characterContainer.appendChild(draggable);
        console.log(`Added element: ${option} to part: ${part}`);

        // Ajouter les événements de manipulation
        makeDraggable(draggable);
        makeResizable(draggable);
        makeRotatable(draggable);
        makeLockable(draggable, lockButton);

        // Appliquer la couleur si sélectionnée et applicable
        if (selectedColor && part !== "body" && part !== "eyes" && part !== "mouth") {
            applyColor(draggable, selectedColor);
        }
    }

    // Fonction pour rendre un élément draggable avec gestion tactile
    function makeDraggable(element) {
        const startDrag = (e) => {
            // Ignorer si l'utilisateur interagit avec une poignée ou le bouton de verrouillage
            if (
                e.target.classList.contains("resize-handle") ||
                e.target.classList.contains("rotate-handle") ||
                e.target.classList.contains("lock-button")
            )
                return;

            // Vérifier si l'élément est verrouillé
            if (element.classList.contains("locked")) {
                return;
            }

            isDragging = true;
            selectedElement = element;
            selectElement(element);

            const rect = element.getBoundingClientRect();
            const containerRect = characterContainer.getBoundingClientRect();

            if (e.type === "touchstart") {
                dragOffsetX = e.touches[0].clientX - rect.left;
                dragOffsetY = e.touches[0].clientY - rect.top;
            } else {
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;
            }

            e.preventDefault();
        };

        const duringDrag = (e) => {
            if (isDragging && selectedElement && !selectedElement.classList.contains("locked")) {
                const containerRect = characterContainer.getBoundingClientRect();
                let clientX, clientY;

                if (e.type === "touchmove") {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }

                let newLeft = clientX - containerRect.left - dragOffsetX;
                let newTop = clientY - containerRect.top - dragOffsetY;

                // Limiter le déplacement à l'intérieur du container
                newLeft = Math.max(
                    0,
                    Math.min(newLeft, containerRect.width - selectedElement.offsetWidth)
                );
                newTop = Math.max(
                    0,
                    Math.min(newTop, containerRect.height - selectedElement.offsetHeight)
                );

                // Utiliser requestAnimationFrame pour une mise à jour fluide
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
                animationFrameId = requestAnimationFrame(() => {
                    selectedElement.style.left = `${newLeft}px`;
                    selectedElement.style.top = `${newTop}px`;
                });
            }
        };

        const endDrag = () => {
            if (isDragging) {
                isDragging = false;
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            }
        };

        // Événements de la souris
        element.addEventListener("mousedown", startDrag);
        document.addEventListener("mousemove", debounce(duringDrag, 10));
        document.addEventListener("mouseup", endDrag);

        // Événements tactiles
        element.addEventListener("touchstart", startDrag, { passive: false });
        document.addEventListener("touchmove", debounce(duringDrag, 10), {
            passive: false,
        });
        document.addEventListener("touchend", endDrag, { passive: false });
    }

    // Fonction pour rendre un élément redimensionnable avec gestion tactile
    function makeResizable(element) {
        const handles = element.querySelectorAll(".resize-handle");
        let isResizing = false;
        let currentHandle = null;
        let startX, startY, startWidth, startHeight, startLeft, startTop;

        const startResize = (e) => {
            // Vérifier si l'élément est verrouillé
            if (element.classList.contains("locked")) {
                return;
            }

            isResizing = true;
            currentHandle = e.target.classList.contains("br")
                ? "br"
                : e.target.classList.contains("bl")
                    ? "bl"
                    : e.target.classList.contains("tr")
                        ? "tr"
                        : "tl";
            selectedElement = element;
            selectElement(element);
            bringToFront(element);

            const rect = element.getBoundingClientRect();
            if (e.type === "touchstart") {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            } else {
                startX = e.clientX;
                startY = e.clientY;
            }
            startWidth = element.offsetWidth;
            startHeight = element.offsetHeight;
            startLeft = element.offsetLeft;
            startTop = element.offsetTop;
            e.preventDefault();
            e.stopPropagation();
        };

        const duringResize = (e) => {
            if (isResizing && selectedElement && !selectedElement.classList.contains("locked")) {
                let clientX, clientY;

                if (e.type === "touchmove") {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }

                let dx = clientX - startX;
                let dy = clientY - startY;

                // Récupérer les échelles actuelles
                const scaleX = parseFloat(selectedElement.dataset.scaleX) || 1;
                const scaleY = parseFloat(selectedElement.dataset.scaleY) || 1;

                // Appliquer les échelles pour ajuster le delta
                dx *= scaleX;
                dy *= scaleY;

                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;

                switch (currentHandle) {
                    case "br":
                        newWidth = startWidth + dx;
                        newHeight = startHeight + dy;
                        break;
                    case "bl":
                        newWidth = startWidth - dx;
                        newHeight = startHeight + dy;
                        newLeft = startLeft + dx;
                        break;
                    case "tr":
                        newWidth = startWidth + dx;
                        newHeight = startHeight - dy;
                        newTop = startTop + dy;
                        break;
                    case "tl":
                        newWidth = startWidth - dx;
                        newHeight = startHeight - dy;
                        newLeft = startLeft + dx;
                        newTop = startTop + dy;
                        break;
                    default:
                        break;
                }

                // Assurer que la largeur et la hauteur restent positives
                newWidth = Math.abs(newWidth);
                newHeight = Math.abs(newHeight);

                // Limiter la taille minimale et maximale
                newWidth = Math.max(30, newWidth);
                newHeight = Math.max(30, newHeight);

                // Calculer le centre actuel
                const centerX = startLeft + startWidth / 2;
                const centerY = startTop + startHeight / 2;

                // Calculer le nouveau centre après redimensionnement
                const newCenterX = newLeft + newWidth / 2;
                const newCenterY = newTop + newHeight / 2;

                // Ajuster le left et top pour maintenir le centre fixe
                newLeft = centerX - newWidth / 2;
                newTop = centerY - newHeight / 2;

                // Limiter les positions pour rester dans le container
                const containerRect = characterContainer.getBoundingClientRect();
                newLeft = Math.max(
                    0,
                    Math.min(newLeft, containerRect.width - newWidth)
                );
                newTop = Math.max(
                    0,
                    Math.min(newTop, containerRect.height - newHeight)
                );

                // Appliquer les nouvelles dimensions et positions avec requestAnimationFrame
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
                animationFrameId = requestAnimationFrame(() => {
                    selectedElement.style.width = `${newWidth}px`;
                    selectedElement.style.height = `${newHeight}px`;
                    selectedElement.style.left = `${newLeft}px`;
                    selectedElement.style.top = `${newTop}px`;
                });
            }
        };

        const endResize = () => {
            if (isResizing) {
                isResizing = false;
                currentHandle = null;
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            }
        };

        handles.forEach((handle) => {
            handle.addEventListener("mousedown", startResize);
            handle.addEventListener("touchstart", startResize, { passive: false });
        });

        // Événements de la souris
        document.addEventListener("mousemove", debounce(duringResize, 10));
        document.addEventListener("mouseup", endResize);

        // Événements tactiles
        document.addEventListener("touchmove", debounce(duringResize, 10), {
            passive: false,
        });
        document.addEventListener("touchend", endResize, { passive: false });
    }

    // Fonction pour rendre un élément rotatable avec gestion tactile
    function makeRotatable(element) {
        const rotateHandle = element.querySelector(".rotate-handle");
        let isRotating = false;
        let centerX, centerY;
        let initialAngle = 0;
        let initialRotation = 0;
        let lastAngle = 0;

        const startRotate = (e) => {
            // Vérifier si l'élément est verrouillé
            if (element.classList.contains("locked")) {
                return;
            }

            isRotating = true;
            selectedElement = element;
            selectElement(element);
            bringToFront(element);

            // Obtenir le centre de l'élément
            const rect = element.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;

            // Obtenir la position initiale de la souris/touch
            let clientX, clientY;
            if (e.type === "touchstart") {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            // Calculer l'angle initial entre le centre et la position initiale
            initialAngle =
                Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);

            // Obtenir la rotation initiale cumulée
            initialRotation = parseFloat(element.dataset.rotation) || 0;

            // Initialiser lastAngle
            lastAngle = initialAngle;

            e.preventDefault();
            e.stopPropagation();
        };

        const duringRotate = (e) => {
            if (!isRotating || !selectedElement || selectedElement.classList.contains("locked")) return;

            let clientX, clientY;
            if (e.type === "touchmove") {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            // Calculer l'angle actuel entre le centre et la position actuelle
            const currentAngle =
                Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);

            // Calculer la différence d'angle depuis la dernière position
            let deltaRotation = currentAngle - lastAngle;

            // Normaliser deltaRotation pour éviter les sauts brusques
            if (deltaRotation > 180) deltaRotation -= 360;
            if (deltaRotation < -180) deltaRotation += 360;

            // Mettre à jour la rotation cumulée
            let newRotation = parseFloat(selectedElement.dataset.rotation) || 0;
            newRotation += deltaRotation;

            // Mettre à jour l'attribut de données de rotation
            selectedElement.dataset.rotation = newRotation.toString();

            // Appliquer la transformation CSS
            updateTransform(selectedElement);

            // Mettre à jour lastAngle
            lastAngle = currentAngle;
        };

        const endRotate = () => {
            if (isRotating) {
                isRotating = false;
            }
        };

        rotateHandle.addEventListener("mousedown", startRotate);
        rotateHandle.addEventListener("touchstart", startRotate, {
            passive: false,
        });

        // Événements de la souris
        document.addEventListener("mousemove", debounce(duringRotate, 10));
        document.addEventListener("mouseup", endRotate);

        // Événements tactiles
        document.addEventListener("touchmove", debounce(duringRotate, 10), {
            passive: false,
        });
        document.addEventListener("touchend", endRotate, { passive: false });
    }

    // Fonction pour rendre un élément verrouillable avec gestion tactile
    function makeLockable(element, lockButton) {
        // Initialiser l'état de verrouillage
        let isLocked = false;

        const toggleLock = (e) => {
            e.stopPropagation(); // Empêche la sélection de l'élément lors du clic sur le bouton de verrouillage

            isLocked = !isLocked;
            element.classList.toggle("locked", isLocked);
            lockButton.classList.toggle("locked", isLocked);

            // Changer l'icône du bouton en fonction de l'état
            lockButton.innerHTML = isLocked ? "🔓" : "🔒";

            console.log(`Element ${isLocked ? "locked" : "unlocked"}`);
        };

        lockButton.addEventListener("click", toggleLock);
        lockButton.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleLock(e);
            }
        });
    }

    // Fonction pour obtenir l'échelle actuelle d'un élément
    function getScale(element) {
        const scaleX = parseFloat(element.dataset.scaleX) || 1;
        const scaleY = parseFloat(element.dataset.scaleY) || 1;
        return { scaleX, scaleY };
    }

    // Fonction pour mettre à jour la transformation CSS
    function updateTransform(element) {
        const rotation = parseFloat(element.dataset.rotation) || 0;
        const scaleX = parseFloat(element.dataset.scaleX) || 1;
        const scaleY = parseFloat(element.dataset.scaleY) || 1;
        element.style.transform = `translate(0%, 0%) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
    }

    // Fonction pour sélectionner un élément
    function selectElement(element) {
        // Désélectionner l'ancien élément, si nécessaire
        if (selectedElement && selectedElement !== element) {
            selectedElement.classList.remove("selected");
        }

        // Sélectionner le nouvel élément
        selectedElement = element;
        selectedElement.classList.add("selected");

        // Masquer les poignées de redimensionnement et de rotation pour tous les autres éléments
        document.querySelectorAll(".draggable").forEach((el) => {
            if (el !== selectedElement) {
                el.classList.remove("selected");
            }
        });
    }

    // Fonction pour appliquer une couleur à un élément
    function applyColor(element, color) {
        // Réinitialiser tous les styles de filtre au cas où il y en aurait déjà
        element.style.filter = '';

        // Si l'élément contient une image
        if (element.querySelector("img")) {
            // Applique un filtre CSS pour colorer l'image
            switch (color) {
                case "rgb(255, 0, 0)": // Rouge
                    element.style.filter = "sepia(1) saturate(10) hue-rotate(0deg)";
                    break;
                case "rgb(0, 255, 0)": // Vert
                    element.style.filter = "sepia(1) saturate(10) hue-rotate(120deg)";
                    break;
                case "rgb(0, 0, 255)": // Bleu
                    element.style.filter = "sepia(1) saturate(10) hue-rotate(240deg)";
                    break;
                case "rgb(0, 255, 255)": // Cyan
                    element.style.filter = "sepia(1) saturate(10) hue-rotate(180deg)";
                    break;
                case "rgb(255, 0, 255)": // Magenta
                    element.style.filter = "sepia(1) saturate(10) hue-rotate(300deg)";
                    break;
                case "rgb(255, 255, 0)": // Jaune
                    element.style.filter = "sepia(1) saturate(10) hue-rotate(60deg)";
                    break;
                case "reset": // Réinitialiser la couleur
                    element.style.filter = "none"; // Réinitialiser le filtre
                    break;
                default:
                    element.style.filter = "none"; // Réinitialiser le filtre par défaut
                    break;
            }
        }
    }

    // Fonction pour obtenir le z-index maximal dans le container
    function getMaxZIndex() {
        let max = 0;
        characterContainer.querySelectorAll(".draggable").forEach((el) => {
            const z = parseInt(window.getComputedStyle(el).zIndex) || 0;
            if (z > max) max = z;
        });
        return max;
    }

    // Fonction pour amener un élément au premier plan
    function bringToFront(element) {
        element.style.zIndex = getMaxZIndex() + 1;
    }

    // Fonction pour envoyer un élément au dos
    function sendToBack(element) {
        element.style.zIndex = getMaxZIndex() - 1;
    }

    // Gestion des boutons de partie
    partButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // Retirer la classe active de tous les boutons
            partButtons.forEach((btn) => btn.classList.remove("active"));
            // Ajouter la classe active au bouton cliqué
            button.classList.add("active");
            // Définir la partie sélectionnée
            selectedPart = button.dataset.part;
            console.log(`Selected part: ${selectedPart}`);
            // Afficher les options pour la partie sélectionnée
            displayOptions(selectedPart);
        });

        // Accessibilité via clavier
        button.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                button.click();
            }
        });
    });

    // Gestion des boutons d'option
    optionButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedPart) {
                alert("Veuillez sélectionner une partie avant de choisir une option.");
                return;
            }

            const option = button.dataset.option;
            const part = button.dataset.part;

            addElement(part, option);
            console.log(`Added part: ${part}, option: ${option}`);
        });

        // Accessibilité via clavier
        button.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                button.click();
            }
        });
    });

    // Gestion des boutons de couleur
    colorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            selectedColor = button.dataset.color;
            console.log(`Selected color: ${selectedColor}`);
            if (
                selectedElement &&
                selectedElement.dataset.part !== "body" &&
                selectedElement.dataset.part !== "eyes" &&
                selectedElement.dataset.part !== "mouth"
            ) {
                applyColor(selectedElement, selectedColor);
            }
        });

        // Accessibilité via clavier
        button.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                button.click();
            }
        });
    });

    // Gestion du bouton de suppression
    deleteButton.addEventListener("click", () => {
        if (selectedElement) {
            if (characterContainer.contains(selectedElement)) {
                characterContainer.removeChild(selectedElement);
                console.log(`Deleted element: ${selectedElement.dataset.option}`);
                selectedElement = null;
            } else {
                console.warn("Selected element not found in the container.");
            }
        } else {
            console.warn("No element selected to delete.");
        }
    });

    // Gestion du bouton Bring Forward
    bringForwardButton.addEventListener("click", () => {
        if (selectedElement) {
            bringToFront(selectedElement);
            console.log(`Brought forward: ${selectedElement.dataset.option}`);
        }
    });

    // Gestion du bouton Send Backward
    sendBackwardButton.addEventListener("click", () => {
        if (selectedElement) {
            sendToBack(selectedElement);
            console.log(`Sent backward: ${selectedElement.dataset.option}`);
        }
    });

    // Gestion du bouton Flip Horizontal
    flipHorizontalButton.addEventListener("click", () => {
        if (selectedElement) {
            let currentScaleX = parseFloat(selectedElement.dataset.scaleX) || 1;
            currentScaleX = currentScaleX === 1 ? -1 : 1;
            selectedElement.dataset.scaleX = currentScaleX.toString();
            updateTransform(selectedElement);
            console.log(`Flipped horizontally: ${selectedElement.dataset.option}`);
        }
    });

    // Gestion du bouton Flip Vertical
    flipVerticalButton.addEventListener("click", () => {
        if (selectedElement) {
            let currentScaleY = parseFloat(selectedElement.dataset.scaleY) || 1;
            currentScaleY = currentScaleY === 1 ? -1 : 1;
            selectedElement.dataset.scaleY = currentScaleY.toString();
            updateTransform(selectedElement);
            console.log(`Flipped vertically: ${selectedElement.dataset.option}`);
        }
    });

    // Fonction pour sauvegarder le canvas en image
    saveButton.addEventListener("click", () => {
        // Créer un canvas temporaire avec une résolution élevée
        const tempCanvas = document.createElement("canvas");
        const containerRect = characterContainer.getBoundingClientRect();
        tempCanvas.width = containerRect.width * scalingFactor;
        tempCanvas.height = containerRect.height * scalingFactor;
        const ctx = tempCanvas.getContext("2d");

        // Trier les éléments par z-index croissant pour dessiner du bas vers le haut
        const elements = Array.from(characterContainer.querySelectorAll(".draggable"));
        elements.sort((a, b) => {
            return (parseInt(window.getComputedStyle(a).zIndex) || 0) - (parseInt(window.getComputedStyle(b).zIndex) || 0);
        });

        // Dessiner chaque élément dans l'ordre trié
        let loadedImages = 0;
        const totalImages = elements.length;

        if (totalImages === 0) {
            downloadCanvas(tempCanvas);
            return;
        }

        elements.forEach((el) => {
            const img = new Image();
            img.crossOrigin = "anonymous"; // Assurez-vous que les images sont CORS-enabled
            img.src = el.querySelector("img").src;
            img.onload = () => {
                // Calculer la position et la taille avec échelle
                const left = el.offsetLeft * scalingFactor;
                const top = el.offsetTop * scalingFactor;
                const width = el.offsetWidth * scalingFactor;
                const height = el.offsetHeight * scalingFactor;

                // Extraire les transformations
                const rotation = parseFloat(el.dataset.rotation) || 0;
                const scaleX = parseFloat(el.dataset.scaleX) || 1;
                const scaleY = parseFloat(el.dataset.scaleY) || 1;

                // Extraire le filtre CSS en utilisant getComputedStyle
                const computedStyle = window.getComputedStyle(el);
                const filter = computedStyle.filter || 'none';

                ctx.save();

                // Appliquer le filtre
                ctx.filter = filter;

                // Appliquer les transformations
                ctx.translate(left + width / 2, top + height / 2);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.scale(scaleX, scaleY);

                // Dessiner l'image
                ctx.drawImage(img, -width / 2, -height / 2, width, height);

                ctx.restore();

                loadedImages++;
                if (loadedImages === totalImages) {
                    downloadCanvas(tempCanvas);
                }
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${img.src}`);
                loadedImages++;
                if (loadedImages === totalImages) {
                    downloadCanvas(tempCanvas);
                }
            };
        });
    });

    // Fonction pour télécharger le canvas comme image
    function downloadCanvas(canvas) {
        const dataURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = "avatar.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("Canvas saved as image");
    }

    // Gestion des événements clavier pour manipuler les objets
    document.addEventListener("keydown", (e) => {
        const step = 5;
        if (!selectedElement) return;

        switch (e.key) {
            case "ArrowUp":
                if (!selectedElement.classList.contains("locked")) {
                    selectedElement.style.top = `${selectedElement.offsetTop - step}px`;
                }
                break;
            case "ArrowDown":
                if (!selectedElement.classList.contains("locked")) {
                    selectedElement.style.top = `${selectedElement.offsetTop + step}px`;
                }
                break;
            case "ArrowLeft":
                if (!selectedElement.classList.contains("locked")) {
                    selectedElement.style.left = `${selectedElement.offsetLeft - step}px`;
                }
                break;
            case "ArrowRight":
                if (!selectedElement.classList.contains("locked")) {
                    selectedElement.style.left = `${selectedElement.offsetLeft + step}px`;
                }
                break;
            case "Delete":
            case "Backspace":
                deleteButton.click();
                break;
            default:
                return;
        }
        e.preventDefault();
    });

    // Gestion des événements de clic pour sélectionner l'élément
    characterContainer.addEventListener("click", (e) => {
        if (e.target.closest(".draggable")) {
            const draggable = e.target.closest(".draggable");
            selectElement(draggable); // Sélectionner le nouvel élément
            console.log(`Selected element: ${draggable.dataset.option}`);
        } else {
            // Si on clique en dehors de l'élément, désélectionner
            if (selectedElement) {
                selectedElement.classList.remove("selected");
                selectedElement = null;
                console.log("Deselected all elements.");
            }
        }
    });

    // Gestion des événements tactiles pour la sélection
    characterContainer.addEventListener(
        "touchstart",
        (e) => {
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target && target.closest(".draggable")) {
                const draggable = target.closest(".draggable");
                selectElement(draggable); // Sélectionner l'élément avec le toucher
                console.log(`Selected element: ${draggable.dataset.option}`);
            } else {
                // Désélectionner si on touche en dehors
                if (selectedElement) {
                    selectedElement.classList.remove("selected");
                    selectedElement = null;
                    console.log("Deselected all elements.");
                }
            }
        },
        { passive: false }
    );

    // Initialiser le corps comme élément draggable (optionnel)
    function initializeBody() {
        addElement("body", "body1"); // Ajoutez le corps initial
    }

    initializeBody();

    // Gestion du bouton V2
    versionButton.addEventListener("click", () => {
        alert("Bienvenue dans la version 2 de GRUMPYCATOR !");
        // Vous pouvez ajouter d'autres fonctionnalités ici, comme rediriger vers une nouvelle page
    });

    // Accessibilité via clavier pour le bouton V2
    versionButton.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            versionButton.click();
        }
    });
});