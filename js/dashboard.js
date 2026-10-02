/**
 * Skillset — Interactive Analytics Dashboard Engine
 * Implements period filtering, dynamic bar charts, calendar date selection,
 * live search filtering, table sorting, interactive modals, and tactile feedback.
 */

// Dataset Definitions
const DASHBOARD_DATA = {
  month: {
    revenue: "$23,902",
    revenueTrend: "4.2%",
    revenueIsUp: true,
    activeUsers: "16,815",
    activeUsersTrend: "1.7%",
    newUsers: "1,457",
    newUsersTrend: "2.9%",
    mentors: "2,023",
    mentorsTrend: "0.9%",
    chartLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    chartValues: [5500, 5000, 7800, 4500, 7000, 3200], // 0 - 10000 scale
    highlightIndex: 2, // March
    growthPercent: 65,
    growthTrend: "0.9%",
    dateRangeText: "1 Sep 2024 - 31 Sep 2024"
  },
  week: {
    revenue: "$6,420",
    revenueTrend: "2.1%",
    revenueIsUp: true,
    activeUsers: "12,400",
    activeUsersTrend: "0.8%",
    newUsers: "380",
    newUsersTrend: "1.4%",
    mentors: "2,010",
    mentorsTrend: "0.3%",
    chartLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    chartValues: [4200, 6100, 7200, 8500, 6800, 4900],
    highlightIndex: 3,
    growthPercent: 58,
    growthTrend: "1.2%",
    dateRangeText: "15 Sep 2024 - 21 Sep 2024"
  },
  day: {
    revenue: "$1,240",
    revenueTrend: "5.8%",
    revenueIsUp: true,
    activeUsers: "3,890",
    activeUsersTrend: "3.2%",
    newUsers: "84",
    newUsersTrend: "0.9%",
    mentors: "1,980",
    mentorsTrend: "0.1%",
    chartLabels: ["00h", "04h", "08h", "12h", "16h", "20h"],
    chartValues: [1200, 1800, 6400, 9200, 8100, 5200],
    highlightIndex: 3,
    growthPercent: 72,
    growthTrend: "2.4%",
    dateRangeText: "19 Sep 2024"
  },
  year: {
    revenue: "$286,400",
    revenueTrend: "14.6%",
    revenueIsUp: true,
    activeUsers: "142,000",
    activeUsersTrend: "18.3%",
    newUsers: "18,920",
    newUsersTrend: "11.2%",
    mentors: "2,023",
    mentorsTrend: "9.4%",
    chartLabels: ["2020", "2021", "2022", "2023", "2024", "2025*"],
    chartValues: [3100, 4800, 6500, 8200, 9500, 4100],
    highlightIndex: 4,
    growthPercent: 82,
    growthTrend: "12.5%",
    dateRangeText: "1 Jan 2024 - 31 Dec 2024"
  }
};

const INITIAL_PURCHASES = [
  {
    id: "#3456791",
    course: "Digital Marketing",
    thumb: "./assets/images/course_marketing.jpg",
    student: "Aria",
    amount: "$ 372,00",
    amountNum: 372.00,
    status: "Paid",
    date: "19 Sep 2024",
    email: "aria.dev@example.com"
  },
  {
    id: "#3456792",
    course: "UI/UX Masterclass",
    thumb: "./assets/images/course_uiux.jpg",
    student: "Lucas Silva",
    amount: "$ 285,00",
    amountNum: 285.00,
    status: "Paid",
    date: "19 Sep 2024",
    email: "lucas.silva@example.com"
  },
  {
    id: "#3456793",
    course: "Full-Stack Web Dev",
    thumb: "./assets/images/course_marketing.jpg",
    student: "Sophia Chen",
    amount: "$ 490,00",
    amountNum: 490.00,
    status: "Paid",
    date: "18 Sep 2024",
    email: "sophia.chen@tech.org"
  },
  {
    id: "#3456794",
    course: "Data Science & AI",
    thumb: "./assets/images/course_uiux.jpg",
    student: "Alexander Wright",
    amount: "$ 520,00",
    amountNum: 520.00,
    status: "Pending",
    date: "17 Sep 2024",
    email: "alex.wright@ai-lab.io"
  },
  {
    id: "#3456795",
    course: "Figma Design Systems",
    thumb: "./assets/images/course_uiux.jpg",
    student: "Emma Watson",
    amount: "$ 199,00",
    amountNum: 199.00,
    status: "Paid",
    date: "16 Sep 2024",
    email: "emma.w@creatives.co"
  }
];

class DashboardApp {
  constructor() {
    this.currentPeriod = 'month';
    this.purchases = [...INITIAL_PURCHASES];
    this.filteredPurchases = [...INITIAL_PURCHASES];
    this.sortField = null;
    this.sortAsc = true;
    this.selectedDay = 19; // Thursday 19 Sep 2024

    this.initElements();
    this.initEventListeners();
    this.renderMetrics();
    this.renderChart();
    this.renderGrowthGauge();
    this.renderTable();
  }

  initElements() {
    // Metric value elements
    this.revValueEl = document.getElementById('metric-rev-value');
    this.revTrendEl = document.getElementById('metric-rev-trend');
    this.usersValueEl = document.getElementById('metric-users-value');
    this.usersTrendEl = document.getElementById('metric-users-trend');
    this.newUsersValueEl = document.getElementById('metric-newusers-value');
    this.newUsersTrendEl = document.getElementById('metric-newusers-trend');
    this.mentorsValueEl = document.getElementById('metric-mentors-value');
    this.mentorsTrendEl = document.getElementById('metric-mentors-trend');

    // Controls
    this.pillTabs = document.querySelectorAll('.pill-tab-btn');
    this.dateRangeEl = document.getElementById('date-range-display');
    this.searchInput = document.getElementById('global-search-input');
    this.chartBarsContainer = document.getElementById('chart-bars-track');
    this.chartXAxis = document.getElementById('chart-x-axis');
    this.chartTooltip = document.getElementById('chart-tooltip');
    
    // Calendar
    this.calendarDays = document.querySelectorAll('.cal-day-cell');
    this.calPrevBtn = document.getElementById('cal-prev-btn');
    this.calNextBtn = document.getElementById('cal-next-btn');
    this.calMonthTitle = document.getElementById('cal-month-title');

    // Growth Gauge
    this.gaugeCircle = document.getElementById('growth-gauge-progress');
    this.gaugeText = document.getElementById('growth-gauge-percent');
    this.growthTrendEl = document.getElementById('growth-trend-label');

    // Table
    this.tableBody = document.getElementById('purchases-tbody');
    this.btnRefresh = document.getElementById('btn-refresh-purchases');
    this.btnExpand = document.getElementById('btn-expand-purchases');

    // Modals
    this.upgradeModal = document.getElementById('upgrade-modal');
    this.detailModal = document.getElementById('purchase-detail-modal');
    this.btnUpgrade = document.getElementById('btn-upgrade-sidebar');
    this.notifBtn = document.getElementById('btn-notifications');
    this.notifDropdown = document.getElementById('notifications-dropdown');
  }

  initEventListeners() {
    // Period Pill Tabs (Day / Week / Month / Year)
    this.pillTabs.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const period = e.currentTarget.getAttribute('data-period');
        this.setPeriod(period);
      });
    });

    // Calendar Days
    this.calendarDays.forEach(cell => {
      cell.addEventListener('click', (e) => {
        const day = parseInt(e.currentTarget.getAttribute('data-day'), 10);
        this.selectCalendarDay(day, e.currentTarget);
      });
    });

    // Calendar Month Navigation
    if (this.calPrevBtn && this.calNextBtn) {
      this.calPrevBtn.addEventListener('click', () => {
        this.showToast('Viewing August 2024 records');
        this.calMonthTitle.textContent = 'August 2024';
      });
      this.calNextBtn.addEventListener('click', () => {
        this.showToast('Viewing October 2024 records');
        this.calMonthTitle.textContent = 'October 2024';
      });
    }

    // Live Search Input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // Table Refresh & Expand
    if (this.btnRefresh) {
      this.btnRefresh.addEventListener('click', () => {
        this.btnRefresh.style.transform = 'rotate(360deg)';
        setTimeout(() => {
          this.btnRefresh.style.transform = 'none';
        }, 500);
        this.purchases = [...INITIAL_PURCHASES];
        this.handleSearch(this.searchInput ? this.searchInput.value : '');
        this.showToast('Course purchases synchronized');
      });
    }

    if (this.btnExpand) {
      this.btnExpand.addEventListener('click', () => {
        this.showToast('Showing full transactions ledger');
      });
    }

    // Table Sort Headers
    document.querySelectorAll('.purchases-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        this.sortTable(field);
      });
    });

    // Upgrade Pro Modal
    if (this.btnUpgrade && this.upgradeModal) {
      this.btnUpgrade.addEventListener('click', () => {
        this.openModal(this.upgradeModal);
      });
    }

    // Modal Close buttons
    document.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeModals();
      });
    });

    // Close modal on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModals();
      });
    });

    // Notifications Dropdown
    if (this.notifBtn && this.notifDropdown) {
      this.notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.notifDropdown.classList.toggle('show');
        this.notifBtn.classList.remove('has-badge');
      });

      document.addEventListener('click', (e) => {
        if (!this.notifDropdown.contains(e.target) && e.target !== this.notifBtn) {
          this.notifDropdown.classList.remove('show');
        }
      });
    }

    // Sidebar Accordions for Analytics & Courses
    document.querySelectorAll('.nav-accordion-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !expanded);
        const submenu = toggle.nextElementSibling;
        if (submenu) {
          submenu.classList.toggle('open', !expanded);
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModals();
    });
  }

  setPeriod(period) {
    if (!DASHBOARD_DATA[period]) return;
    this.currentPeriod = period;

    this.pillTabs.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-period') === period);
    });

    const data = DASHBOARD_DATA[period];
    if (this.dateRangeEl) {
      this.dateRangeEl.textContent = data.dateRangeText;
    }

    this.renderMetrics();
    this.renderChart();
    this.renderGrowthGauge();
  }

  renderMetrics() {
    const data = DASHBOARD_DATA[this.currentPeriod];
    if (!data) return;

    if (this.revValueEl) this.revValueEl.textContent = data.revenue;
    if (this.revTrendEl) this.revTrendEl.innerHTML = `&#8599; ${data.revenueTrend} from last month`;

    if (this.usersValueEl) this.usersValueEl.textContent = data.activeUsers;
    if (this.usersTrendEl) this.usersTrendEl.innerHTML = `&#8599; ${data.activeUsersTrend} from last month`;

    if (this.newUsersValueEl) this.newUsersValueEl.textContent = data.newUsers;
    if (this.newUsersTrendEl) this.newUsersTrendEl.innerHTML = `&#8600; ${data.newUsersTrend} from last month`;

    if (this.mentorsValueEl) this.mentorsValueEl.textContent = data.mentors;
    if (this.mentorsTrendEl) this.mentorsTrendEl.innerHTML = `&#8599; ${data.mentorsTrend} from last month`;
  }

  renderChart() {
    const data = DASHBOARD_DATA[this.currentPeriod];
    if (!this.chartBarsContainer || !data) return;

    this.chartBarsContainer.innerHTML = '';
    this.chartXAxis.innerHTML = '';

    const maxScale = 10000;
    const maxHeightPx = 180; // matches track height

    data.chartLabels.forEach((label, index) => {
      const val = data.chartValues[index];
      const heightPercent = Math.min(100, Math.max(15, (val / maxScale) * 100));
      const isHighlighted = (index === data.highlightIndex);

      // Create bar column
      const col = document.createElement('div');
      col.className = `chart-column ${isHighlighted ? 'highlight' : ''}`;
      col.setAttribute('data-val', `$${val.toLocaleString()}`);
      col.setAttribute('data-label', label);

      const bar = document.createElement('div');
      bar.className = 'chart-bar-pill';
      bar.style.height = `${(heightPercent / 100) * maxHeightPx}px`;

      col.appendChild(bar);

      // Hover Tooltip logic
      col.addEventListener('mouseenter', (e) => {
        this.showChartTooltip(col, label, val);
      });
      col.addEventListener('mouseleave', () => {
        this.hideChartTooltip();
      });

      this.chartBarsContainer.appendChild(col);

      // X Label
      const xLbl = document.createElement('div');
      xLbl.className = `chart-x-label ${isHighlighted ? 'highlight' : ''}`;
      xLbl.textContent = label;
      this.chartXAxis.appendChild(xLbl);
    });
  }

  showChartTooltip(targetCol, label, val) {
    if (!this.chartTooltip) return;
    const rect = targetCol.getBoundingClientRect();
    const containerRect = this.chartBarsContainer.getBoundingClientRect();

    this.chartTooltip.textContent = `${label}: $${val.toLocaleString()}`;
    const leftOffset = rect.left - containerRect.left + (rect.width / 2);
    const topOffset = rect.top - containerRect.top;

    this.chartTooltip.style.left = `${leftOffset + 48}px`;
    this.chartTooltip.style.top = `${topOffset + 20}px`;
    this.chartTooltip.classList.add('visible');
  }

  hideChartTooltip() {
    if (this.chartTooltip) {
      this.chartTooltip.classList.remove('visible');
    }
  }

  renderGrowthGauge() {
    const data = DASHBOARD_DATA[this.currentPeriod];
    const percent = data.growthPercent || 65;

    if (this.gaugeText) {
      this.gaugeText.textContent = `${percent}%`;
    }
    if (this.growthTrendEl) {
      this.growthTrendEl.innerHTML = `&#8599; ${data.growthTrend} from last month`;
    }

    if (this.gaugeCircle) {
      const radius = 26;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (percent / 100) * circumference;
      this.gaugeCircle.style.strokeDasharray = `${circumference} ${circumference}`;
      this.gaugeCircle.style.strokeDashoffset = offset;
    }
  }

  selectCalendarDay(day, cellEl) {
    this.selectedDay = day;
    this.calendarDays.forEach(c => c.classList.remove('active'));
    cellEl.classList.add('active');

    const dayName = cellEl.querySelector('.cal-day-name').textContent;
    this.showToast(`Selected ${dayName}, Sep ${day}`);
  }

  handleSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      this.filteredPurchases = [...this.purchases];
    } else {
      this.filteredPurchases = this.purchases.filter(item => {
        return (
          item.course.toLowerCase().includes(q) ||
          item.student.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q) ||
          item.amount.toLowerCase().includes(q)
        );
      });
    }
    this.renderTable();
  }

  sortTable(field) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }

    this.filteredPurchases.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      if (field === 'amount') {
        valA = a.amountNum;
        valB = b.amountNum;
      }

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    this.renderTable();
    this.showToast(`Sorted by ${field} (${this.sortAsc ? 'Ascending' : 'Descending'})`);
  }

  renderTable() {
    if (!this.tableBody) return;
    this.tableBody.innerHTML = '';

    if (this.filteredPurchases.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="5" style="text-align: center; padding: 32px; color: var(--text-muted);">
          No matching course purchases found.
        </td>
      `;
      this.tableBody.appendChild(emptyRow);
      return;
    }

    this.filteredPurchases.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="course-cell">
            <img class="course-thumb-img" src="${item.thumb}" alt="${item.course}">
            <span class="course-title-text">${item.course}</span>
          </div>
        </td>
        <td class="student-name-text">${item.student}</td>
        <td class="student-id-text">${item.id}</td>
        <td class="amount-text">${item.amount}</td>
        <td>
          <span class="status-pill ${item.status.toLowerCase()}">${item.status}</span>
        </td>
      `;

      tr.addEventListener('click', () => {
        this.openPurchaseDetail(item);
      });

      this.tableBody.appendChild(tr);
    });
  }

  openPurchaseDetail(item) {
    const modalContent = document.getElementById('purchase-detail-body');
    if (modalContent) {
      modalContent.innerHTML = `
        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 20px;">
          <img src="${item.thumb}" style="width: 80px; height: 56px; border-radius: 10px; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <div>
            <h3 style="font-size: 18px; font-weight: 700; color: #161719;">${item.course}</h3>
            <span style="font-size: 13px; color: #747983;">Student ID: ${item.id}</span>
          </div>
        </div>

        <div style="background: #f7f9fa; border-radius: 14px; padding: 18px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 13.5px;">
            <span style="color: #747983;">Enrolled Student:</span>
            <strong style="color: #161719;">${item.student}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13.5px;">
            <span style="color: #747983;">Email Address:</span>
            <span style="color: #161719;">${item.email}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13.5px;">
            <span style="color: #747983;">Transaction Date:</span>
            <span style="color: #161719;">${item.date}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13.5px;">
            <span style="color: #747983;">Payment Status:</span>
            <span class="status-pill ${item.status.toLowerCase()}">${item.status}</span>
          </div>
          <div style="border-top: 1px dashed #d5d9e0; margin-top: 6px; padding-top: 10px; display: flex; justify-content: space-between; font-size: 15px;">
            <span style="font-weight: 600; color: #161719;">Total Charged:</span>
            <strong style="font-size: 18px; color: #161719;">${item.amount}</strong>
          </div>
        </div>

        <button class="promo-btn modal-close-trigger" style="background: #18191b; border: none; padding: 12px; font-size: 13.5px;">
          Close Details
        </button>
      `;

      // Re-attach close trigger for newly rendered button
      modalContent.querySelector('.modal-close-trigger').addEventListener('click', () => {
        this.closeModals();
      });
    }

    this.openModal(this.detailModal);
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.add('open');
  }

  closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}

// Initialize when DOM content is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new DashboardApp();
});
