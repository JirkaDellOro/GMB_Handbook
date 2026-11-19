async function loadProgrammes() {
    const target = document.querySelector("#programme-list");
    if (!target)
        return;
    try {
        const response = await fetch("./_System/programmes.json");
        if (!response.ok)
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const programmes = await response.json();
        if (!Array.isArray(programmes))
            throw new Error("The programme configuration must be a list.");
        target.replaceChildren();
        for (const programme of programmes) {
            const link = document.createElement("a");
            link.className = "module-tile";
            link.href = programme.path;
            const code = document.createElement("span");
            code.textContent = programme.code;
            const description = document.createElement("span");
            const title = document.createElement("span");
            title.textContent = programme.title;
            const degree = document.createElement("small");
            degree.textContent = programme.degree;
            description.append(title, degree);
            const arrow = document.createElement("span");
            arrow.textContent = "↗";
            link.append(code, description, arrow);
            target.append(link);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        target.replaceChildren();
        const notice = document.createElement("p");
        notice.className = "notice";
        notice.textContent = `Study programmes could not be loaded: ${message}`;
        target.append(notice);
    }
}
void loadProgrammes();
