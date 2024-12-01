document.addEventListener("DOMContentLoaded", () => {
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
    const versionButton = document.getElementById("versionButton");

    let selectedPart = null;
    let selectedColor = null;
    let selectedElement = null;

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let animationFrameId;

    const scalingFactor = 2;

    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    function displayOptions(part) {
        document.querySelectorAll(".options-group").forEach((group) => {
            group.style.display = "none";
        });

        const selectedGroup = document.getElementById(`options-${part}`);
        if (selectedGroup) {
            selectedGroup.style.display = "block";
        }

        if (part === "body" || part === "eyes" || part === "mouth") {
            colorSelection.style.display = "none";
        } else {
            colorSelection.style.display = "block";
        }

        optionsDisplay.classList.add("active");
    }

    function addElement(part, option) {
        const imgSrc = `assets/avatar/${part}/${option}.png`;

        const draggable = document.createElement("div");
        draggable.classList.add("draggable");
        draggable.dataset.part = part;
        draggable.dataset.option = option;
        draggable.style.left = "30%";
        draggable.style.top = "30%";
        draggable.style.transform = "translate(0%, 0%) rotate(0deg) scale(1)";
        draggable.style.width = "100px";
        draggable.style.height = "100px";
        draggable.style.zIndex = getMaxZIndex() + 1;

        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = `${part} ${option}`;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.pointerEvents = "none";
        img.crossOrigin = "anonymous";
        draggable.appendChild(img);

        const handles = ["br", "bl", "tr", "tl"];
        handles.forEach((handle) => {
            const resizeHandle = document.createElement("div");
            resizeHandle.classList.add("resize-handle", handle);
            draggable.appendChild(resizeHandle);
        });

        const rotateHandle = document.createElement("div");
        rotateHandle.classList.add("rotate-handle");
        draggable.appendChild(rotateHandle);

        const lockButton = document.createElement("button");
        lockButton.classList.add("lock-button");
        lockButton.innerHTML = "🔒";
        draggable.appendChild(lockButton);

        draggable.dataset.rotation = "0";
        draggable.dataset.scaleX = "1";
        draggable.dataset.scaleY = "1";

        if (part === "body" || part === "eyes" || part === "mouth") {
            draggable.dataset.color = null;
            draggable.style.filter = "none";
        } else {
            draggable.dataset.color = null;
        }

        characterContainer.appendChild(draggable);

        makeDraggable(draggable);
        makeResizable(draggable);
        makeRotatable(draggable);
        makeLockable(draggable, lockButton);

        if (selectedColor && part !== "body" && part !== "eyes" && part !== "mouth") {
            applyColor(draggable, selectedColor);
        }

        // Animation handled via CSS
    }

    function makeDraggable(element) {
        const startDrag = (e) => {
            if (
                e.target.classList.contains("resize-handle") ||
                e.target.classList.contains("rotate-handle") ||
                e.target.classList.contains("lock-button")
            )
                return;

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

                newLeft = Math.max(
                    0,
                    Math.min(newLeft, containerRect.width - selectedElement.offsetWidth)
                );
                newTop = Math.max(
                    0,
                    Math.min(newTop, containerRect.height - selectedElement.offsetHeight)
                );

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

        element.addEventListener("mousedown", startDrag);
        document.addEventListener("mousemove", debounce(duringDrag, 10));
        document.addEventListener("mouseup", endDrag);

        element.addEventListener("touchstart", startDrag, { passive: false });
        document.addEventListener("touchmove", debounce(duringDrag, 10), { passive: false });
        document.addEventListener("touchend", endDrag, { passive: false });
    }

    function makeResizable(element) {
        const handles = element.querySelectorAll(".resize-handle");
        let isResizing = false;
        let currentHandle = null;
        let startX, startY, startWidth, startHeight, startLeft, startTop;

        const startResize = (e) => {
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

                const scaleX = parseFloat(selectedElement.dataset.scaleX) || 1;
                const scaleY = parseFloat(selectedElement.dataset.scaleY) || 1;

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

                newWidth = Math.abs(newWidth);
                newHeight = Math.abs(newHeight);

                newWidth = Math.max(30, newWidth);
                newHeight = Math.max(30, newHeight);

                const centerX = startLeft + startWidth / 2;
                const centerY = startTop + startHeight / 2;

                const newCenterX = newLeft + newWidth / 2;
                const newCenterY = newTop + newHeight / 2;

                newLeft = centerX - newWidth / 2;
                newTop = centerY - newHeight / 2;

                const containerRect = characterContainer.getBoundingClientRect();
                newLeft = Math.max(
                    0,
                    Math.min(newLeft, containerRect.width - newWidth)
                );
                newTop = Math.max(
                    0,
                    Math.min(newTop, containerRect.height - newHeight)
                );

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

        document.addEventListener("mousemove", debounce(duringResize, 10));
        document.addEventListener("mouseup", endResize);

        document.addEventListener("touchmove", debounce(duringResize, 10), { passive: false });
        document.addEventListener("touchend", endResize, { passive: false });
    }

    function makeRotatable(element) {
        const rotateHandle = element.querySelector(".rotate-handle");
        let isRotating = false;
        let centerX, centerY;
        let initialAngle = 0;
        let initialRotation = 0;
        let lastAngle = 0;

        const startRotate = (e) => {
            if (element.classList.contains("locked")) {
                return;
            }

            isRotating = true;
            selectedElement = element;
            selectElement(element);
            bringToFront(element);

            const rect = element.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;

            let clientX, clientY;
            if (e.type === "touchstart") {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            initialAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
            initialRotation = parseFloat(element.dataset.rotation) || 0;
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

            const currentAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
            let deltaRotation = currentAngle - lastAngle;

            if (deltaRotation > 180) deltaRotation -= 360;
            if (deltaRotation < -180) deltaRotation += 360;

            let newRotation = parseFloat(selectedElement.dataset.rotation) || 0;
            newRotation += deltaRotation;

            selectedElement.dataset.rotation = newRotation.toString();
            updateTransform(selectedElement);
            lastAngle = currentAngle;
        };

        const endRotate = () => {
            if (isRotating) {
                isRotating = false;
            }
        };

        rotateHandle.addEventListener("mousedown", startRotate);
        rotateHandle.addEventListener("touchstart", startRotate, { passive: false });

        document.addEventListener("mousemove", debounce(duringRotate, 10));
        document.addEventListener("mouseup", endRotate);

        document.addEventListener("touchmove", debounce(duringRotate, 10), { passive: false });
        document.addEventListener("touchend", endRotate, { passive: false });
    }

    function makeLockable(element, lockButton) {
        let isLocked = false;

        const toggleLock = (e) => {
            e.stopPropagation();
            isLocked = !isLocked;
            element.classList.toggle("locked", isLocked);
            lockButton.classList.toggle("locked", isLocked);
            lockButton.innerHTML = isLocked ? "🔓" : "🔒";
        };

        lockButton.addEventListener("click", toggleLock);
        lockButton.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleLock(e);
            }
        });
    }

    function getScale(element) {
        const scaleX = parseFloat(element.dataset.scaleX) || 1;
        const scaleY = parseFloat(element.dataset.scaleY) || 1;
        return { scaleX, scaleY };
    }

    function updateTransform(element) {
        const rotation = parseFloat(element.dataset.rotation) || 0;
        const scaleX = parseFloat(element.dataset.scaleX) || 1;
        const scaleY = parseFloat(element.dataset.scaleY) || 1;
        element.style.transform = `translate(0%, 0%) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
    }

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
    }

    function applyColor(element, color) {
        const part = element.dataset.part;

        if (part === "body" || part === "eyes" || part === "mouth") {
            return;
        }

        if (color === "reset") {
            element.dataset.color = null;
        } else {
            element.dataset.color = color;
        }

        let filterValue = "none";
        switch (color) {
            case "rgb(255, 0, 0)":
                filterValue = "sepia(1) saturate(10) hue-rotate(0deg)";
                break;
            case "rgb(0, 255, 0)":
                filterValue = "sepia(1) saturate(10) hue-rotate(120deg)";
                break;
            case "rgb(0, 0, 255)":
                filterValue = "sepia(1) saturate(10) hue-rotate(240deg)";
                break;
            case "rgb(0, 255, 255)":
                filterValue = "sepia(1) saturate(10) hue-rotate(180deg)";
                break;
            case "rgb(255, 0, 255)":
                filterValue = "sepia(1) saturate(10) hue-rotate(300deg)";
                break;
            case "rgb(255, 255, 0)":
                filterValue = "sepia(1) saturate(10) hue-rotate(60deg)";
                break;
            case "reset":
                filterValue = "none";
                break;
            default:
                filterValue = "none";
                break;
        }

        element.style.filter = filterValue;
    }

    function getMaxZIndex() {
        let max = 0;
        characterContainer.querySelectorAll(".draggable").forEach((el) => {
            const z = parseInt(window.getComputedStyle(el).zIndex) || 0;
            if (z > max) max = z;
        });
        return max;
    }

    function bringToFront(element) {
        element.style.zIndex = getMaxZIndex() + 1;
    }

    function sendToBack(element) {
        element.style.zIndex = getMaxZIndex() - 1;
    }

    partButtons.forEach((button) => {
        button.addEventListener("click", () => {
            partButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");
            selectedPart = button.dataset.part;
            displayOptions(selectedPart);
        });

        button.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                button.click();
            }
        });
    });

    optionButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedPart) {
                alert("Please select a part before choosing an option.");
                return;
            }

            const option = button.dataset.option;
            const part = button.dataset.part;

            addElement(part, option);
        });

        button.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                button.click();
            }
        });
    });

    colorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            selectedColor = button.dataset.color;
            if (
                selectedElement &&
                selectedElement.dataset.part !== "body" &&
                selectedElement.dataset.part !== "eyes" &&
                selectedElement.dataset.part !== "mouth"
            ) {
                applyColor(selectedElement, selectedColor);
            }
        });

        button.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                button.click();
            }
        });
    });

    deleteButton.addEventListener("click", () => {
        if (selectedElement) {
            if (characterContainer.contains(selectedElement)) {
                characterContainer.removeChild(selectedElement);
                selectedElement = null;
            }
        }
    });

    bringForwardButton.addEventListener("click", () => {
        if (selectedElement) {
            bringToFront(selectedElement);
        }
    });

    sendBackwardButton.addEventListener("click", () => {
        if (selectedElement) {
            sendToBack(selectedElement);
        }
    });

    flipHorizontalButton.addEventListener("click", () => {
        if (selectedElement) {
            let currentScaleX = parseFloat(selectedElement.dataset.scaleX) || 1;
            currentScaleX = currentScaleX === 1 ? -1 : 1;
            selectedElement.dataset.scaleX = currentScaleX.toString();
            updateTransform(selectedElement);
        }
    });

    flipVerticalButton.addEventListener("click", () => {
        if (selectedElement) {
            let currentScaleY = parseFloat(selectedElement.dataset.scaleY) || 1;
            currentScaleY = currentScaleY === 1 ? -1 : 1;
            selectedElement.dataset.scaleY = currentScaleY.toString();
            updateTransform(selectedElement);
        }
    });

    saveButton.addEventListener("click", () => {
        const tempCanvas = document.createElement("canvas");
        const containerRect = characterContainer.getBoundingClientRect();
        tempCanvas.width = containerRect.width * scalingFactor;
        tempCanvas.height = containerRect.height * scalingFactor;
        const ctx = tempCanvas.getContext("2d");

        const elements = Array.from(characterContainer.querySelectorAll(".draggable"));
        elements.sort((a, b) => {
            return (parseInt(window.getComputedStyle(a).zIndex) || 0) - (parseInt(window.getComputedStyle(b).zIndex) || 0);
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
            img.crossOrigin = "anonymous";
            img.src = imgElement.src;
            img.onload = () => {
                const left = el.offsetLeft * scalingFactor;
                const top = el.offsetTop * scalingFactor;
                const width = el.offsetWidth * scalingFactor;
                const height = el.offsetHeight * scalingFactor;

                const rotation = parseFloat(el.dataset.rotation) || 0;
                const scaleX = parseFloat(el.dataset.scaleX) || 1;
                const scaleY = parseFloat(el.dataset.scaleY) || 1;

                const color = el.dataset.color || null;
                const part = el.dataset.part;

                ctx.save();

                ctx.translate(left + width / 2, top + height / 2);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.scale(scaleX, scaleY);

                ctx.drawImage(img, -width / 2, -height / 2, width, height);

                if (color && part !== "body" && part !== "eyes" && part !== "mouth") {
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = color;
                    ctx.fillRect(-width / 2, -height / 2, width, height);
                    ctx.globalCompositeOperation = 'source-over';
                }

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
    });

    function downloadCanvas(canvas) {
        const dataURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = "avatar.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

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

    characterContainer.addEventListener("click", (e) => {
        if (e.target.closest(".draggable")) {
            const draggable = e.target.closest(".draggable");
            selectElement(draggable);
        } else {
            if (selectedElement) {
                selectedElement.classList.remove("selected");
                selectedElement = null;
            }
        }
    });

    characterContainer.addEventListener(
        "touchstart",
        (e) => {
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target && target.closest(".draggable")) {
                const draggable = target.closest(".draggable");
                selectElement(draggable);
            } else {
                if (selectedElement) {
                    selectedElement.classList.remove("selected");
                    selectedElement = null;
                }
            }
        },
        { passive: false }
    );

    // Version Button Functionality
    versionButton.addEventListener("click", () => {
        window.location.href = "index.html";
    });

    versionButton.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            versionButton.click();
        }
    });

    // Additional functionalities specific to V2 can be added here
});