// Global state
let currentUser = null
let userRole = null
let currentOrder = []
let menuData = []
const currentCustomerId = null

// Initialize Firebase and Firestore
const firebase = window.firebase
const db = firebase.firestore()

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] App initialized")
  setupEventListeners()
  checkAuthState()
  setMinDate()
  loadSampleData()
})

function checkAuthState() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      currentUser = user
      loadUserRole()
    } else {
      showPage("loginPage")
    }
  })
}

function loadUserRole() {
  db.collection("users")
    .doc(currentUser.uid)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userRole = doc.data().role
        routeUserToDashboard()
      }
    })
    .catch((error) => {
      console.error("[v0] Error loading user role:", error)
    })
}

function routeUserToDashboard() {
  switch (userRole) {
    case "admin":
      showPage("adminDashboard")
      loadAdminData()
      break
    case "customer":
      showPage("customerDashboard")
      loadCustomerMenu()
      break
    case "cashier":
      showPage("cashierDashboard")
      loadCashierMenu()
      drawLoyaltyWheel()
      break
  }
}

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault()
  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .catch((error) => {
      document.getElementById("loginError").textContent = error.message
    })
})

document.getElementById("signupForm").addEventListener("submit", (e) => {
  e.preventDefault()
  const email = document.getElementById("signupEmail").value
  const password = document.getElementById("signupPassword").value
  const username = document.getElementById("signupUsername").value
  const role = document.getElementById("signupRole").value

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((result) => {
      return db.collection("users").doc(result.user.uid).set({
        username: username,
        email: email,
        role: role,
        createdAt: new Date(),
      })
    })
    .then(() => {
      goToLogin(new Event("click"))
    })
    .catch((error) => {
      document.getElementById("signupError").textContent = error.message
    })
})

function logout() {
  firebase
    .auth()
    .signOut()
    .then(() => {
      currentUser = null
      userRole = null
      currentOrder = []
      showPage("loginPage")
    })
}

function goToLogin(e) {
  e.preventDefault()
  showPage("loginPage")
}

function goToSignup(e) {
  e.preventDefault()
  showPage("signupPage")
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active")
  })
  document.getElementById(pageId).classList.add("active")
}

function toggleMenu(menuId) {
  const menu = document.getElementById(menuId)
  menu.classList.toggle("show")
}

function loadCashierMenu() {
  const grid = document.getElementById("cashierMenuGrid")
  if (!grid) return

  grid.innerHTML = menuData
    .map(
      (item) => `
        <div class="menu-item" onclick="addToOrder('${item.id}', '${item.code}', '${item.name}', ${item.price})">
            <img src="/coffee-item---item-name-.jpg" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>₱${item.price.toFixed(2)}</p>
            <p class="menu-item-description">${item.code}</p>
        </div>
    `,
    )
    .join("")
}

function filterCashierMenu(category) {
  const buttons = document.querySelectorAll(".cashier-menu .category-btn")
  buttons.forEach((btn) => btn.classList.remove("active"))
  event.target.classList.add("active")

  const filtered = category === "all" ? menuData : menuData.filter((item) => item.category === category)
  const grid = document.getElementById("cashierMenuGrid")
  grid.innerHTML = filtered
    .map(
      (item) => `
        <div class="menu-item" onclick="addToOrder('${item.id}', '${item.code}', '${item.name}', ${item.price})">
            <img src="/coffee-item---item-name-.jpg" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>₱${item.price.toFixed(2)}</p>
            <p class="menu-item-description">${item.code}</p>
        </div>
    `,
    )
    .join("")
}

function addToOrder(itemId, itemCode, itemName, itemPrice) {
  const existing = currentOrder.find((item) => item.id === itemId)
  if (existing) {
    existing.qty++
  } else {
    currentOrder.push({
      id: itemId,
      code: itemCode,
      name: itemName,
      price: itemPrice,
      qty: 1,
    })
  }
  updateOrderDisplay()
}

function updateOrderDisplay() {
  const tbody = document.getElementById("orderTableBody")
  if (!tbody) return

  let total = 0
  tbody.innerHTML = currentOrder
    .map((item) => {
      const amount = item.price * item.qty
      total += amount
      return `
            <tr>
                <td>${item.qty}</td>
                <td>${item.code}</td>
                <td>₱${amount.toFixed(2)}</td>
            </tr>
        `
    })
    .join("")

  document.getElementById("orderTotal").textContent = `₱${total.toFixed(2)}`
  updateChange()
}

function updateChange() {
  const total = Number.parseFloat(document.getElementById("orderTotal").textContent.replace("₱", "") || 0)
  const cash = Number.parseFloat(document.getElementById("cashAmount").value || 0)
  const change = cash - total
  document.getElementById("orderChange").textContent = `₱${change >= 0 ? change.toFixed(2) : "0.00"}`
}

document.getElementById("cashAmount")?.addEventListener("input", updateChange)

function printOrder() {
  alert("Order printed!")
  currentOrder = []
  updateOrderDisplay()
  document.getElementById("customerIdInput").value = ""
}

function editOrder() {
  alert("Edit order functionality")
}

function changeAccount() {
  showPage("loginPage")
}

function checkBookings() {
  loadBookingsForModal()
  document.getElementById("bookingsModal").classList.add("active")
}

function closeBookingsModal() {
  document.getElementById("bookingsModal").classList.remove("active")
}

function loadAdminData() {
  loadAdminMenu()
  loadDrinks()
  loadBookingsForAdmin()
}

function loadAdminMenu() {
  const grid = document.getElementById("adminMenuGrid")
  if (!grid) return

  grid.innerHTML = menuData
    .map(
      (item) => `
        <div class="menu-item">
            <img src="/coffee-item---item-name-.jpg" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>₱${item.price.toFixed(2)}</p>
            <p class="menu-item-description">${item.code}</p>
            <div class="menu-item-actions">
                <button class="edit-btn" onclick="editMenuItem('${item.id}')">EDIT</button>
                <button class="delete-btn" onclick="deleteMenuItem('${item.id}')">DELETE</button>
            </div>
        </div>
    `,
    )
    .join("")
}

function filterAdminMenu(category) {
  const buttons = document.querySelectorAll(".section-header .category-btn")
  buttons.forEach((btn) => btn.classList.remove("active"))
  event.target.classList.add("active")

  const filtered = category === "all" ? menuData : menuData.filter((item) => item.category === category)
  const grid = document.getElementById("adminMenuGrid")
  grid.innerHTML = filtered
    .map(
      (item) => `
        <div class="menu-item">
            <img src="/coffee-item---item-name-.jpg" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>₱${item.price.toFixed(2)}</p>
            <p class="menu-item-description">${item.code}</p>
            <div class="menu-item-actions">
                <button class="edit-btn" onclick="editMenuItem('${item.id}')">EDIT</button>
                <button class="delete-btn" onclick="deleteMenuItem('${item.id}')">DELETE</button>
            </div>
        </div>
    `,
    )
    .join("")
}

function editMenuItem(itemId) {
  alert("Edit menu item: " + itemId)
}

function deleteMenuItem(itemId) {
  if (confirm("Delete this item?")) {
    menuData = menuData.filter((item) => item.id !== itemId)
    loadAdminMenu()
  }
}

function loadDrinks() {
  const list = document.getElementById("drinksList")
  if (!list) return

  list.innerHTML = menuData
    .filter((item) => item.category === "coffee")
    .map((item) => `<div class="drink-item">${item.name}</div>`)
    .join("")
}

function saveDrinkWheel() {
  alert("Drink wheel saved!")
}

function loadBookingsForAdmin() {
  const list = document.getElementById("adminBookingsList")
  if (!list) return

  const bookings = [
    {
      name: "CUSTOMER NAME",
      date: "10/06/2025",
      time: "9:30 AM - 10:00 AM",
      preorder: ["1 REG.CROS", "1 BISCFF. FRAP", "1 S&B.WAF."],
      mode: "PICKUP",
    },
    {
      name: "CUSTOMER NAME",
      date: "10/07/2025",
      time: "10:30 AM - 1:00 PM",
      preorder: [],
      mode: "BOOKING",
      notes: "DIY DECORATION BY HOST",
    },
  ]

  list.innerHTML = bookings
    .map(
      (booking) => `
        <div class="booking-card">
            <h3>${booking.name}</h3>
            <p>DATE: ${booking.date}</p>
            <p>TIME: ${booking.time}</p>
            ${booking.preorder.length > 0 ? `<p><strong>PREORDER:</strong><br>${booking.preorder.join("<br>")}</p>` : ""}
            ${booking.notes ? `<p>NOTES: ${booking.notes}</p>` : ""}
            <p><strong>MODE:</strong> ${booking.mode}</p>
        </div>
    `,
    )
    .join("")
}

function loadBookingsForModal() {
  const list = document.getElementById("modalBookingsList")
  const bookings = [
    {
      name: "CUSTOMER NAME",
      date: "10/06/2025",
      time: "9:30 AM - 10:00 AM",
      preorder: ["1 REG.CROS", "1 BISCFF. FRAP", "1 S&B.WAF."],
      mode: "PICKUP",
    },
    {
      name: "CUSTOMER NAME",
      date: "10/07/2025",
      time: "10:30 AM - 1:00 PM",
      preorder: [],
      mode: "BOOKING",
      notes: "DIY DECORATION BY HOST",
    },
  ]

  list.innerHTML = bookings
    .map(
      (booking) => `
        <div class="booking-card">
            <h3>${booking.name}</h3>
            <p>DATE: ${booking.date}</p>
            <p>TIME: ${booking.time}</p>
            ${booking.preorder.length > 0 ? `<p><strong>PREORDER:</strong><br>${booking.preorder.join("<br>")}</p>` : ""}
            ${booking.notes ? `<p>NOTES: ${booking.notes}</p>` : ""}
            <p><strong>MODE:</strong> ${booking.mode}</p>
        </div>
    `,
    )
    .join("")
}

function showAdminSection(sectionName) {
  document.querySelectorAll(".admin-section").forEach((section) => {
    section.classList.remove("active")
  })
  document
    .getElementById(`admin${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}-section`)
    .classList.add("active")
}

function closeTrendSection() {
  showAdminSection("menu")
}

function loadCustomerMenu() {
  const grid = document.getElementById("customerMenuGrid")
  if (!grid) return

  grid.innerHTML = menuData
    .map(
      (item) => `
        <div class="menu-item" onclick="addToCart('${item.id}', '${item.name}', ${item.price})">
            <img src="/coffee-item---item-name-.jpg" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p>₱${item.price.toFixed(2)}</p>
        </div>
    `,
    )
    .join("")
}

function filterCustomerMenu(category) {
  const buttons = document.querySelectorAll(".nav-section .category-btn")
  buttons.forEach((btn) => btn.classList.remove("active"))
  event.target.classList.add("active")

  const filtered = category === "all" ? menuData : menuData.filter((item) => item.category === category)
  const grid = document.getElementById("customerMenuGrid")
  grid.innerHTML = filtered
    .map(
      (item) => `
        <div class="menu-item" onclick="addToCart('${item.id}', '${item.name}', ${item.price})">
            <img src="/coffee-item---item-name-.jpg" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p>₱${item.price.toFixed(2)}</p>
        </div>
    `,
    )
    .join("")
}

function addToCart(itemId, itemName, itemPrice) {
  alert(`${itemName} added to cart!`)
}

function goToCustomerPage(page) {
  if (page === "menu") showPage("customerDashboard")
  else if (page === "loyalty") showPage("customerLoyalty")
  else if (page === "bookings") showPage("customerBookings")
  else if (page === "booking") showPage("customerBooking")
  else if (page === "preorder") showPage("customerPreorder")
}

function spinLoyaltyWheel() {
  alert("Spinning the wheel...")
}

function confirmBooking() {
  const date = document.getElementById("bookingDate").value
  const selectedSlot = document.querySelector(".time-slot.selected")
  if (!date || !selectedSlot) {
    alert("Please select date and time")
    return
  }
  alert(`Booking confirmed for ${date} at ${selectedSlot.textContent}`)
  goToCustomerPage("menu")
}

function submitPreorder() {
  alert("Preorder submitted!")
  goToCustomerPage("menu")
}

function setMinDate() {
  const today = new Date().toISOString().split("T")[0]
  const dateInput = document.getElementById("bookingDate")
  if (dateInput) {
    dateInput.min = today
    dateInput.addEventListener("change", loadTimeSlots)
  }
}

function loadTimeSlots() {
  const slotsContainer = document.getElementById("timeSlots")
  if (!slotsContainer) return

  const slots = ["9:30 AM - 10:00 AM", "10:30 AM - 1:00 PM", "2:00 PM - 3:00 PM", "4:00 PM - 5:00 PM"]
  slotsContainer.innerHTML = slots
    .map(
      (slot) => `
        <div class="time-slot" onclick="selectTimeSlot(this)">${slot}</div>
    `,
    )
    .join("")
}

function selectTimeSlot(element) {
  document.querySelectorAll(".time-slot").forEach((slot) => slot.classList.remove("selected"))
  element.classList.add("selected")
}

function drawLoyaltyWheel() {
  const canvas = document.getElementById("loyaltyWheel")
  if (!canvas) return

  const ctx = canvas.getContext("2d")
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = 120
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"]

  colors.forEach((color, i) => {
    const startAngle = (i / colors.length) * Math.PI * 2
    const endAngle = ((i + 1) / colors.length) * Math.PI * 2

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 2
    ctx.stroke()
  })
}

function setupEventListeners() {
  document.getElementById("bookingDate")?.addEventListener("change", loadTimeSlots)
  document.getElementById("cashAmount")?.addEventListener("input", updateChange)
}

function loadSampleData() {
  menuData = [
    {
      id: "1",
      name: "BISCOFF FRAPPE",
      code: "BIS.FRAP",
      category: "coffee",
      price: 159.0,
      description: "WHOLE MILK TOPPED WITH A DRIZZLE OF CARAMEL. FINISHED WITH BISCOFF BISCUIT ON TOP",
    },
    {
      id: "2",
      name: "CROISSANT",
      code: "CROSNT",
      category: "pastry",
      price: 59.0,
      description: "BUTTERY CROISSANT",
    },
    {
      id: "3",
      name: "BLUEBERRY WAFFLE",
      code: "BLBRY.WAF",
      category: "pastry",
      price: 160.0,
      description: "FRESH BLUEBERRY WAFFLE",
    },
    {
      id: "4",
      name: "CAPPUCCINO",
      code: "CAPPUCINO",
      category: "coffee",
      price: 70.0,
      description: "CLASSIC CAPPUCCINO",
    },
    {
      id: "5",
      name: "AMERICANO",
      code: "AMERICANO",
      category: "coffee",
      price: 55.0,
      description: "STRONG AMERICANO",
    },
    {
      id: "6",
      name: "MACCHIATO",
      code: "MACCHIATO",
      category: "coffee",
      price: 99.0,
      description: "ESPRESSO WITH STEAMED MILK",
    },
  ]
}
