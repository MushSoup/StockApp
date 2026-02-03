let currentView = null;

        function setView(view) {
            currentView = view;
            
            // Update active button state
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-view="${view}"]`).classList.add('active');
            
            loadContent();
        }

        document.getElementById("industry-select")
            .addEventListener("change", () => {
                loadContent();
            });

        function loadContent() {
            const industry = document.getElementById("industry-select").value;
            if (!industry || !currentView) return;

            const contentBox = document.getElementById("content");
            
            // Show appropriate skeleton based on view type
            if (currentView === 'model') {
                contentBox.innerHTML = createModelSkeletonHTML();
            } else {
                contentBox.innerHTML = createTableSkeletonHTML(currentView === 'metrics' ? 8 : 5);
            }

            fetch(`/industry-view?industry=${encodeURIComponent(industry)}&view=${currentView}`)
                .then(res => res.json())
                .then(render)
                .catch(err => {
                    contentBox.innerHTML = `<div class="error-message">Error loading data: ${err.message}</div>`;
                });
        }

        function createTableSkeletonHTML(rows = 5) {
            return `
                <div class="table-wrapper">
                    <table class="skeleton-table">
                        <thead>
                            <tr>
                                <th><div class="skeleton skeleton-header"></div></th>
                                <th><div class="skeleton skeleton-header"></div></th>
                                <th><div class="skeleton skeleton-header"></div></th>
                                <th><div class="skeleton skeleton-header"></div></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Array(rows).fill(0).map(() => `
                                <tr>
                                    <td><div class="skeleton skeleton-cell wide"></div></td>
                                    <td><div class="skeleton skeleton-cell"></div></td>
                                    <td><div class="skeleton skeleton-cell narrow"></div></td>
                                    <td><div class="skeleton skeleton-cell"></div></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        function createModelSkeletonHTML() {
            return `
                <div class="skeleton-images-grid">
                    <div class="skeleton skeleton-image large"></div>
                    <div class="skeleton skeleton-image"></div>
                    <div class="skeleton skeleton-image"></div>
                </div>
                <div class="table-wrapper">
                    <table class="skeleton-table">
                        <thead>
                            <tr>
                                <th><div class="skeleton skeleton-header"></div></th>
                                <th><div class="skeleton skeleton-header"></div></th>
                                <th><div class="skeleton skeleton-header"></div></th>
                                <th><div class="skeleton skeleton-header"></div></th>
                                <th><div class="skeleton skeleton-header"></div></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Array(5).fill(0).map(() => `
                                <tr>
                                    <td><div class="skeleton skeleton-cell"></div></td>
                                    <td><div class="skeleton skeleton-cell"></div></td>
                                    <td><div class="skeleton skeleton-cell"></div></td>
                                    <td><div class="skeleton skeleton-cell wide"></div></td>
                                    <td><div class="skeleton skeleton-cell"></div></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        function render(data) {
            const box = document.getElementById("content");
            box.innerHTML = "";

            if (data.type === "error") {
                box.innerHTML = `<div class="error-message">${data.message}</div>`;
                return;
            }

            if (data.type === "table") {
                const wrapper = document.createElement("div");
                wrapper.className = "table-wrapper";
                wrapper.appendChild(renderTable(data.columns, data.rows, data.type));
                box.appendChild(wrapper);
            }

            if (data.type === "metricTable") {
                const wrapper = document.createElement("div");
                wrapper.className = "table-wrapper";
                
                const scrollDiv = document.createElement("div");
                scrollDiv.className = "table-scroll";
                scrollDiv.appendChild(renderTable(data.columns, data.rows, data.type));
                wrapper.appendChild(scrollDiv);
                
                box.appendChild(wrapper);
            }

            if (data.type === "model_test") {
                // Create grid for images
                if (data.images && data.images.length > 0) {
                    const imagesGrid = document.createElement("div");
                    imagesGrid.className = "images-grid";
                    
                    data.images.forEach(src => {
                        const img = document.createElement("img");
                        img.src = "/" + src;
                        img.alt = "Model testing visualization";
                        imagesGrid.appendChild(img);
                    });
                    
                    box.appendChild(imagesGrid);
                }

                // Add table below images
                if (data.table) {
                    // Debug: Log the data structure
                    console.log("Model test table data:");
                    console.log("Columns:", data.table.columns);
                    console.log("Rows:", data.table.rows);
                    console.log("First row:", data.table.rows[0]);
                    
                    const wrapper = document.createElement("div");
                    wrapper.className = "table-wrapper";
                    wrapper.appendChild(renderTable(
                        data.table.columns,
                        data.table.rows,
                        "model_test"
                    ));
                    box.appendChild(wrapper);
                }
            }
        }

function renderTable(columns, rows, type) {
    const table = document.createElement("table");
    const thead = table.createTHead();
    const trHead = thead.insertRow();
    
    columns.forEach((c) => {
        const th = document.createElement("th");
        th.innerText = (c === "stockDifferencePercentage") ? "Actual Stock Changes" 
                : (c === "Rank") ? "Predicted Rank" 
                : (c === "company ID") ? "Company Ticker" 
                : c;
        trHead.appendChild(th);
    });

    const tbody = table.createTBody();

    rows.forEach((row) => {
        const tr = tbody.insertRow();

        row.forEach((v, colIndex) => {
            const td = tr.insertCell();
            const columnName = columns[colIndex];

            // 1. Rank badge logic
            if (type === "table" && colIndex === columns.length - 1 && columnName.toLowerCase().includes("rank")) {
                const badge = document.createElement("span");
                badge.className = "rank-badge";
                if (parseInt(v) <= 3) badge.classList.add("top-3");
                badge.innerText = v;
                td.appendChild(badge);
                return;
            }

            // 2. Handle comma-separated numbers (e.g., "-0.0165954104,0.3834986026")
            if (typeof v === "string" && v.includes(",")) {
                const numbers = v.split(",");
                const allNumbers = numbers.every(n => !isNaN(parseFloat(n.trim())));
                
                if (allNumbers) {
                    // Round each number to 2 decimal places
                    const roundedNumbers = numbers.map(n => {
                        const num = parseFloat(n.trim());
                        return Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
                    });
                    td.innerText = roundedNumbers.join(", ");
                    return;
                }
            }

            // 3. UNIVERSAL NUMBER LOGIC (Applies to all tables/columns)
            let num = null;
            if (typeof v === "number") {
                num = v;
            } else if (typeof v === "string") {
                const parsed = parseFloat(v);
                if (!isNaN(parsed)) num = parsed;
            }

            // If it's a valid number, we handle rounding here for EVERYONE
            if (num !== null && isFinite(num)) {
                // Round to 2 decimal places, but keep integers as integers
                const rounded = Number.isInteger(num) ? num : parseFloat(num.toFixed(2));

                // Check if this specific column needs the special Arrow/Percent styling
                if (type === "table" && columnName === "stockDifferencePercentage") {
                    const span = document.createElement("span");
                    if (num > 0) {
                        span.className = "value-positive";
                        span.innerHTML = `${rounded}%<span class="value-arrow">▲</span>`;
                    } else if (num < 0) {
                        span.className = "value-negative";
                        span.innerHTML = `${rounded}%<span class="value-arrow">▼</span>`;
                    } else {
                        span.className = "value-neutral";
                        span.innerText = `${rounded}%`;
                    }
                    td.appendChild(span);
                } else {
                    // Just a normal number in any other table/column - now ROUNDED to 2 decimals!
                    td.innerText = rounded;
                }
                return; 
            }

            // 4. Default fallback for non-numeric text
            td.innerText = v ?? "";
        });
    });

    return table;
}