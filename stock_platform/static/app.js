let charts = {};

// THE MODIFIED TOOLTIP: Minimalist with Red/Green movement logic
const cleanTooltip = {
    enabled: true,
    backgroundColor: '#111418',
    borderColor: '#c5a059',
    borderWidth: 1,
    padding: 10,
    displayColors: false,
    callbacks: {
        title: () => '', 
        label: (ctx) => `${ctx.parsed.y.toFixed(2)}`,
        labelTextColor: (ctx) => {
            const index = ctx.dataIndex;
            const dataset = ctx.dataset.data;
            if (index > 0) {
                return dataset[index] >= dataset[index - 1] ? '#0ecb81' : '#ff4d4d';
            }
            return '#fff';
        }
    }
};

async function update() {
    try {
        const res = await fetch('/api/data');
        const d = await res.json();

        // Update Stats
        document.getElementById('d-pv').innerText = d.metrics.pv;
        document.getElementById('d-vol').innerText = d.metrics.vol;
        document.getElementById('d-ret').innerText = d.metrics.ret;
        
        ['var', 'sharpe', 'beta', 'mdd', 'vol'].forEach(id => {
            let el = document.getElementById(id);
            if(el) el.innerText = d.metrics[id];
        });

        // Update Tables
        document.querySelector('#sectorTable tbody').innerHTML = d.sectors.map(s => 
            `<tr><td><b>${s.name}</b></td><td>${s.weight}</td><td style="color:var(--accent)">${s.status}</td></tr>`
        ).join('');

        document.querySelector('#suggestTable tbody').innerHTML = d.execution.map(e => 
            `<tr><td>${e.type}</td><td style="color:#0ecb81; font-weight:bold">${e.act}</td></tr>`
        ).join('');

        document.querySelector('#modelTable tbody').innerHTML = d.models.map(m => 
            `<tr><td>${m.name}</td><td>${m.acc}%</td><td>${m.drift}</td><td style="color:#0ecb81">${m.status}</td></tr>`
        ).join('');

        renderPerformance(d.history);
        renderRisk(d.mc);
        renderModels(d.models);
    } catch(e) { console.error(e); }
}

function renderPerformance(history) {
    const ctx = document.getElementById('equityChart').getContext('2d');
    if(charts.eq) charts.eq.destroy();
    charts.eq = new Chart(ctx, {
        type: 'line', 
        data: { 
            labels: history.map((_,i)=> `H-${40-i}`), // X-axis Labels (Hours ago)
            datasets: [{ 
                data: history, 
                borderColor: '#c5a059', 
                borderWidth: 2, 
                pointRadius: 0, 
                hoverRadius: 6, 
                fill: true, 
                backgroundColor: 'rgba(197, 160, 89, 0.05)' 
            }] 
        },
        options: { 
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: false }, tooltip: cleanTooltip },
            scales: { 
                x: { 
                    display: true, // ENABLED X-AXIS
                    grid: { display: false }, 
                    ticks: { color: '#6c727a', font: { size: 10 } } 
                }, 
                y: { 
                    display: true, // ENABLED Y-AXIS
                    position: 'left',
                    grid: { color: '#1a1d22' }, 
                    ticks: { color: '#6c727a', font: { size: 10 } } 
                } 
            } 
        }
    });
}

function renderRisk(paths) {
    const ctx = document.getElementById('riskChart').getContext('2d');
    if(charts.risk) charts.risk.destroy();
    
    charts.risk = new Chart(ctx, {
        type: 'line', 
        data: { 
            labels: paths[0].map((_,i)=> `+${i}h`), // X-axis (Future Hours)
            datasets: paths.map((p, i) => ({
                data: p, 
                borderColor: i === 0 ? '#c5a059' : 'rgba(197, 160, 89, 0.12)', 
                borderWidth: 1, 
                pointRadius: 0 
            }))
        },
        options: { 
            maintainAspectRatio: false, 
            animation: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: false }, tooltip: cleanTooltip },
            scales: { 
                x: { 
                    display: true, 
                    grid: { display: false }, 
                    ticks: { color: '#6c727a', font: { size: 10 } } 
                }, 
                y: { 
                    display: true, 
                    position: 'left',
                    grid: { color: '#1a1d21' }, 
                    ticks: { color: '#6c727a', font: { size: 10 } } 
                } 
            } 
        }
    });
}

function renderModels(models) {
    const ctx = document.getElementById('modelBarChart').getContext('2d');
    if(charts.bar) {
        charts.bar.data.datasets[0].data = models.map(m => m.acc);
        charts.bar.update('none');
    } else {
        charts.bar = new Chart(ctx, {
            type: 'bar', data: {
                labels: models.map(m => m.name),
                datasets: [{ data: models.map(m => m.acc), backgroundColor: '#c5a059', barThickness: 20 }]
            },
            options: { 
                indexAxis: 'y', 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { 
                    x: { min: 0, max: 100, ticks: { color: '#6c727a' }, grid: { color: '#1a1d22' } }, 
                    y: { ticks: { color: '#fff' }, grid: { display: false } } 
                }
            }
        });
    }
}

function tab(e, id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    e.currentTarget.classList.add('active');
}

update();
setInterval(update, 10000);