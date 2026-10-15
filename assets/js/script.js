document.addEventListener("DOMContentLoaded", () => {
    const zipInput = document.getElementById("zip-input");
    const zipDropzone = document.getElementById("zip-dropzone");
    const zipStatus = document.getElementById("zip-status");

    const followersInput = document.getElementById("followers-input");
    const followingInput = document.getElementById("following-input");

    let followersSet = null;
    let followingList = null;
    let currentSource = null; // Tracks active upload mode: 'zip' or 'manual'

    // --- RESET HELPERS ---
    function resetZipInput() {
        if (zipInput) zipInput.value = "";
        if (zipStatus) zipStatus.textContent = "";
    }

    function resetManualInputs() {
        if (followersInput) followersInput.value = "";
        if (followingInput) followingInput.value = "";

        const selFollowers = document.getElementById("selected-followers");
        const selFollowing = document.getElementById("selected-following");
        if (selFollowers) selFollowers.textContent = "";
        if (selFollowing) selFollowing.textContent = "";
    }

    function clearResults() {
        const resultsOutput = document.getElementById("results-output");
        if (resultsOutput) resultsOutput.replaceChildren();
    }

    // --- ZIP FILE HANDLING ---
    if (zipInput && zipDropzone) {
        zipInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) handleZipFile(file);
        });

        // Drag & Drop visual state
        ["dragenter", "dragover"].forEach((eventName) => {
            zipDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                zipDropzone.classList.add("drag-over");
            });
        });

        ["dragleave", "drop"].forEach((eventName) => {
            zipDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                zipDropzone.classList.remove("drag-over");
            });
        });

        zipDropzone.addEventListener("drop", (e) => {
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith(".zip")) {
                handleZipFile(file);
            } else {
                zipStatus.textContent = "Please drop a valid .zip file.";
                zipStatus.style.color = "#d9534f";
            }
        });
    }

    async function handleZipFile(file) {
        zipStatus.textContent = "Unzipping and reading files locally...";
        zipStatus.style.color = "var(--primary-color)";

        try {
            const zip = await JSZip.loadAsync(file);
            let rawFollowers = null;
            let rawFollowing = null;

            // Search files in ZIP regardless of root folder structure
            for (const relativePath of Object.keys(zip.files)) {
                if (relativePath.endsWith("followers_1.json") || relativePath.endsWith("followers.json")) {
                    const content = await zip.files[relativePath].async("string");
                    rawFollowers = JSON.parse(content);
                } else if (relativePath.endsWith("following.json")) {
                    const content = await zip.files[relativePath].async("string");
                    rawFollowing = JSON.parse(content);
                }
            }

            if (!rawFollowers || !rawFollowing) {
                zipStatus.textContent = "Missing 'followers_1.json' or 'following.json' inside zip archive.";
                zipStatus.style.color = "#d9534f";
                return; // Return early without clearing existing valid state or results
            }

            if (!isValidFollowersFile(rawFollowers) || !isValidFollowingFile(rawFollowing)) {
                zipStatus.textContent = "Invalid JSON data structure inside ZIP file.";
                zipStatus.style.color = "#d9534f";
                return; // Return early without clearing existing valid state or results
            }

            // ZIP verified: Now safely switch mode, clear manual inputs & previous results
            currentSource = "zip";
            resetManualInputs();
            clearResults();

            // Parse Followers
            followersSet = new Set(
                rawFollowers.map((user) => user.string_list_data[0].value)
            );

            // Parse Following
            followingList = rawFollowing.relationships_following
                .map((item) => ({
                    username: item.title,
                    href: getCleanInstagramUrl(item.title)
                }))
                .filter((user) => !user.username.startsWith("__deleted__"));

            zipStatus.textContent = `Success! Processed ${followersSet.size} followers & ${followingList.length} following.`;
            zipStatus.style.color = "#24cb0a";

            checkAndCompare(followersSet, followingList);

        } catch (err) {
            console.error("ZIP Error:", err);
            zipStatus.textContent = "Error reading ZIP file. Please ensure it is a valid Instagram export.";
            zipStatus.style.color = "#d9534f";
        }
    }

    // --- MANUAL JSON FALLBACK HANDLING ---
    if (followersInput) {
        followersInput.addEventListener("change", (event) => {
            readFile(event, (parsedData) => {
                const outputElem = document.getElementById("selected-followers");

                if (!isValidFollowersFile(parsedData)) {
                    outputElem.textContent = "Invalid file! Please select 'followers_1.json'.";
                    outputElem.style.color = "#d9534f";
                    return; // Return early without clearing existing valid state or results
                }

                // Clear previous ZIP state & results
                if (currentSource === "zip") {
                    resetZipInput();
                    followersSet = null;
                    followingList = null;
                    clearResults();
                }

                currentSource = "manual";

                outputElem.textContent = `Loaded ${parsedData.length} followers!`;
                outputElem.style.color = "#24cb0a";

                followersSet = new Set(
                    parsedData.map((user) => user.string_list_data[0].value)
                );

                if (followersSet !== null && followingList !== null) {
                    checkAndCompare(followersSet, followingList);
                }
            });
        });
    }

    if (followingInput) {
        followingInput.addEventListener("change", (event) => {
            readFile(event, (parsedData) => {
                const outputElem = document.getElementById("selected-following");

                if (!isValidFollowingFile(parsedData)) {
                    outputElem.textContent = "Invalid file! Please select 'following.json'.";
                    outputElem.style.color = "#d9534f";
                    return; // Return early without clearing existing valid state or results
                }

                // Clear previous ZIP state & results
                if (currentSource === "zip") {
                    resetZipInput();
                    followersSet = null;
                    followingList = null;
                    clearResults();
                }

                currentSource = "manual";

                followingList = parsedData.relationships_following
                    .map((item) => ({
                        username: item.title,
                        href: getCleanInstagramUrl(item.title)
                    }))
                    .filter((user) => !user.username.startsWith("__deleted__"));

                outputElem.textContent = `Loaded ${followingList.length} following accounts!`;
                outputElem.style.color = "#24cb0a";

                if (followersSet !== null && followingList !== null) {
                    checkAndCompare(followersSet, followingList);
                }
            });
        });
    }
});

// Reusable Async FileReader Helper
function readFile(event, callback) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const parsedData = JSON.parse(e.target.result);
            callback(parsedData);
        } catch (err) {
            console.error("JSON Parsing Error:", err);
            // Handle malformed non-JSON files gracefully
            const outputElem = event.target.id === "followers-input"
                ? document.getElementById("selected-followers")
                : document.getElementById("selected-following");

            if (outputElem) {
                outputElem.textContent = "Invalid JSON file structure!";
                outputElem.style.color = "#d9534f";
            }
        }
    };

    reader.readAsText(file);
}

// Comparison Function
function checkAndCompare(followersSet, followingList) {
    if (!followersSet || !followingList) return;

    // Accounts that do not follow back
    const nonFollowers = followingList
        .filter(user => !followersSet.has(user.username));

    // Convert followingList to a Set of usernames for O(1) lookup
    const followingSet = new Set(followingList.map(u => u.username));

    // People that i don't follow back
    const fans = [...followersSet]
        .filter((username) => !followingSet.has(username))
        .map((username) => ({
            username: username,
            href: getCleanInstagramUrl(username)
        }));

    renderResults(nonFollowers, fans);
}

function renderResults(nonFollowers, fans) {
    const resultsOutput = document.getElementById("results-output");
    if (!resultsOutput) return;

    // Clear previous output safely
    resultsOutput.replaceChildren();

    // Create Search Bar Container
    const searchContainer = document.createElement("div");
    searchContainer.className = "search-container";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "search-input";
    searchInput.placeholder = "Search usernames...";
    searchInput.autocomplete = "off";

    searchContainer.appendChild(searchInput);

    // Create Tab Header Container
    const tabsHeader = document.createElement("div");
    tabsHeader.className = "tabs-header";

    // Create Tab Buttons
    const nonFollowersBtn = document.createElement("button");
    nonFollowersBtn.className = "tab-btn active";
    nonFollowersBtn.textContent = `Not Following Back (${nonFollowers.length})`;

    const fansBtn = document.createElement("button");
    fansBtn.className = "tab-btn";
    fansBtn.textContent = `Fans (${fans.length})`;

    tabsHeader.appendChild(nonFollowersBtn);
    tabsHeader.appendChild(fansBtn);

    // Create Content Panels
    const nonFollowersPanel = document.createElement("div");
    nonFollowersPanel.className = "tab-content active";
    nonFollowersPanel.appendChild(buildUserListElement(nonFollowers, "No non-followers found!"));

    const fansPanel = document.createElement("div");
    fansPanel.className = "tab-content";
    fansPanel.appendChild(buildUserListElement(fans, "No fans found!"));

    // Attach Tab Switcher Event Listeners
    nonFollowersBtn.addEventListener("click", () => {
        nonFollowersBtn.classList.add("active");
        fansBtn.classList.remove("active");
        nonFollowersPanel.classList.add("active");
        fansPanel.classList.remove("active");

        // Re-apply search filter when switching tabs
        filterUserCards(searchInput.value);
    });

    fansBtn.addEventListener("click", () => {
        fansBtn.classList.add("active");
        nonFollowersBtn.classList.remove("active");
        fansPanel.classList.add("active");
        nonFollowersPanel.classList.remove("active");

        // Re-apply search filter when switching tabs
        filterUserCards(searchInput.value);
    });

    // Real-Time Search Event Listener
    searchInput.addEventListener("input", (e) => {
        filterUserCards(e.target.value);
    });

    // Mount everything to the output container
    resultsOutput.appendChild(searchContainer);
    resultsOutput.appendChild(tabsHeader);
    resultsOutput.appendChild(nonFollowersPanel);
    resultsOutput.appendChild(fansPanel);
}

// Helper function to build user cards HTML
function buildUserListElement(users, emptyMessage) {
    const container = document.createElement("div");

    // List is completely empty to begin with
    if (users.length === 0) {
        const emptyParagraph = document.createElement("p");
        emptyParagraph.className = "empty-msg";
        emptyParagraph.textContent = emptyMessage;
        container.appendChild(emptyParagraph);
        return container;
    }

    const listDiv = document.createElement("div");
    listDiv.className = "user-list";

    users.forEach(user => {
        const card = document.createElement("div");
        card.className = "user-card";

        const link = document.createElement("a");
        link.href = user.href;
        link.target = "_blank"; // open in new tab
        link.rel = "noopener noreferrer";
        link.textContent = `@${user.username}`;

        card.addEventListener("click", () => {
            window.open(user.href, "_blank", "noopener,noreferrer");
        });

        card.appendChild(link);
        listDiv.appendChild(card);
    });

    container.appendChild(listDiv);

    // Hidden empty state element toggled dynamically when search returns 0 results
    const searchEmptyMsg = document.createElement("p");
    searchEmptyMsg.className = "empty-msg search-empty-msg";
    searchEmptyMsg.textContent = "No matching usernames found";
    searchEmptyMsg.style.display = "none";
    container.appendChild(searchEmptyMsg);

    return container;
}

function filterUserCards(query) {
    const searchTerm = query.toLowerCase().trim();

    // Target cards inside the currently active tab panel
    const activePanel = document.querySelector(".tab-content.active");
    if (!activePanel) return;

    const cards = activePanel.querySelectorAll(".user-card");
    const searchEmptyMsg = activePanel.querySelector(".search-empty-msg");

    if (cards.length === 0) return; // If list was originally empty, skip filtering

    let visibleCount = 0;

    cards.forEach(card => {
        const username = card.textContent.toLowerCase();
        if (username.includes(searchTerm)) {
            card.style.display = ""; // Show matching card
            visibleCount++;
        } else {
            card.style.display = "none"; // Hide non-matching card
        }
    });

    // Toggle search empty state depending on whether any cards match
    if (searchEmptyMsg) {
        searchEmptyMsg.style.display = visibleCount === 0 ? "block" : "none";
    }
}

function getCleanInstagramUrl(username) {
    return `https://www.instagram.com/${username}/`;
}

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("guide-modal");
    const openBtn = document.getElementById("open-guide-btn");
    const closeBtn = document.getElementById("close-guide-btn");
    const gotItBtn = document.getElementById("modal-got-it-btn");

    if (!modal || !openBtn) return;

    function openModal() {
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    function closeModal() {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = ""; // Restore scrolling
    }

    openBtn.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);
    gotItBtn.addEventListener("click", closeModal);

    // Close on click outside card
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("is-open")) {
            closeModal();
        }
    });
});

// Register Service Worker for PWA Support
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
            .catch((err) => console.error("Service Worker registration failed:", err));
    });
}