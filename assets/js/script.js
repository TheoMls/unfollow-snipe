document.addEventListener("DOMContentLoaded", () => {
    const followersInput = document.getElementById("followers-input");
    const followingInput = document.getElementById("following-input");

    let followersSet = null;
    let followingList = null;

    // Process Followers File
    followersInput.addEventListener("change", (event) => {
        readFile(event, (parsedData) => {
            const outputElem = document.getElementById("selected-followers");

            if (!isValidFollowersFile(parsedData)) {
                outputElem.textContent = "Invalid file! Please select 'followers_1.json'.";
                outputElem.style.color = "#d9534f";
                followersSet = null;
                return;
            }

            outputElem.textContent = `Loaded ${parsedData.length} followers!`;
            outputElem.style.color = "#24cb0a"

            followersSet = new Set(
                parsedData.map((user) => user.string_list_data[0].value)
            );

            if (followersSet !== null && followingList !== null) {
                checkAndCompare(followersSet, followingList);
            }
        });
    });

    // Process Following File
    followingInput.addEventListener("change", (event) => {
        readFile(event, (parsedData) => {
            const outputElem = document.getElementById("selected-following");

            if (!isValidFollowingFile(parsedData)) {
                outputElem.textContent = "Invalid file! Please select 'following.json'.";
                outputElem.style.color = "#d9534f";
                followingList = null;
                return;
            }

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
});

// Reusable Async FileReader Helper
function readFile(event, callback) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        const parsedData = JSON.parse(e.target.result);
        callback(parsedData); // Pass data back to caller when ready
    };

    reader.readAsText(file);
}

// Comparison Function
function checkAndCompare(followersSet, followingList) {
    if (!followersSet || !followingList) return;

    // Accounts i follow that do not follow back
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
    return container;
}

function filterUserCards(query) {
    const searchTerm = query.toLowerCase().trim();

    // Target cards inside the currently active tab panel
    const activePanel = document.querySelector(".tab-content.active");
    if (!activePanel) return;

    const cards = activePanel.querySelectorAll(".user-card");

    cards.forEach(card => {
        const username = card.textContent.toLowerCase();
        if (username.includes(searchTerm)) {
            card.style.display = ""; // Show matching card
        } else {
            card.style.display = "none"; // Hide non-matching card
        }
    });
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