// Import Firebase
import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"

// Global state
let currentUser = null
let userRole = null
let currentOrder = []
let menuData = []

// Declare auth and db variables
const auth = firebase.auth() // Assuming firebase is imported
const db = firebase.firestore() // Assuming firebase is imported

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners()
  loadMenuData()
  checkAuthState()
})

// Authentication functions
function checkAuthState() {
  auth.onAuthStateChanged((user) => {
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
      break
  }
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault()
  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  try {
    await auth.signInWithEmailAndPassword(email, password)
  } catch (error) {
    document.getElementById("loginError").textContent = error.message
  }
})

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault()
  const email = document.getElementById("signupEmail").value
  const password = document.getElementById("signupPassword").value
  const username = document.getElementById("signupUsername").value
  const role = document.getElementById("signupRole").value

  try {
    const result = await auth.createUserWithEmailAndPassword(email, password)
    await db.collection("users").doc(result.user.uid).set({
      username: username,
      email: email,
      role: role,
      createdAt: new Date(),
    })
    currentUser = result.user
    userRole = role
    routeUserToDashboard()
  } catch (error) {
    document.getElementById("signupError").textContent = error.message
  }
})

function logout() {
  auth.signOut().then(() => {
    currentUser = null
    userRole = null
    currentOrder = []
    showPage("loginPage")
  })
}

// Page Management
function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active")
  })
  document.getElementById(pageId).classList.add("active")
}

function goToLogin() {
  showPage("loginPage")
}

function goToSignup() {
  showPage("signupPage")
}

function goToCustomerPage(page) {
  if (page === "menu") showPage("customerDashboard")
  else if (page === "loyalty") showPage("customerLoyalty")
  else if (page === "bookings") showPage("customerBookings")
  else if (page === "booking") showPage("customerBooking")
}

function goToCashierPage(page) {
  if (page === "main") showPage("cashierDashboard")
  else if (page === "settings") showPage("cashierSettings")
}

function toggleMenu(menuId) {
  const menu = document.getElementById(menuId)
  menu.classList.toggle("show")
}

// Menu Management
function loadMenuData() {
  db.collection("menu")
    .get()
    .then((snapshot) => {
      menuData = []
      snapshot.forEach((doc) => {
        menuData.push({ id: doc.id, ...doc.data() })
      })
      loadCustomerMenu()
      loadCashierMenu()
    })
}

function loadCustomerMenu() {
  if (!document.getElementById("customerMenu")) return
  document.getElementById("customerMenu").innerHTML = menuData
    .map(
      (item) => `
        <div class="menu-item" onclick="addToOrder('${item.id}', '${item.name}', ${item.price})">
            <img src="/--item-category-.jpg" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>₱${item.price.toFixed(2)}</p>
        </div>
    `,
    )
    .join("")
}

function loadCashierMenu() {
  if (!document.getElementById("cashierMenuGrid")) return
  document.getElementById("cashierMenuGrid").innerHTML = menuData
    .map(
      (item) => `
        <div class="menu-item" onclick="addToOrder('${item.id}', '${item.name}', ${item.price})">
            <img src="/--item-category-.jpg" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>₱${item.price.toFixed(2)}</p>
        </div>
    `,
    )
    .join("")
}

function filterMenuByCategory(category) {
  document.querySelectorAll(".category-btn").forEach((btn) => btn.classList.remove("active"))
  event.target.classList.add("active")

  const filtered = category === "all" ? menuData : menuData.filter((item) => item.category === category)
  document.getElementById("customerMenu").innerHTML = filtered
    .map(
      (item) => `
        <div class="menu-item" onclick="addToOrder('${item.id}', '${item.name}', ${item.price})">
            <img src="/--item-category-.jpg" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>₱${item.price.toFixed(2)}</p>
        </div>
    `,
    )
    .join("")
}

function filterCashierMenu(category) {
  document.querySelectorAll(".cashier-menu .category-btn").forEach((btn) => btn.classList.remove("active"))
  event.target.classList.add("active")

  const filtered = category === "all" ? menuData : menuData.filter((item) => item.category === category)
  document.getElementById("cashierMenuGrid").innerHTML = filtered
    .map(
      (item) => `
        <div class="menu-item" onclick="addToOrder('${item.id}', '${item.name}', ${item.price})">
            <img src="/--item-category-.jpg" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>₱${item.price.toFixed(2)}</p>
        </div>
    `,
    )
    .join("")
}

// Order Management
function addToOrder(itemId, itemName, itemPrice) {
  const existingItem = currentOrder.find((item) => item.id === itemId)
  if (existingItem) {
    existingItem.qty++
  } else {
    currentOrder.push({ id: itemId, name: itemName, price: itemPrice, qty: 1 })
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
                <td>${item.name}</td>
                <td>₱${amount.toFixed(2)}</td>
            </tr>
        `
    })
    .join("")

  document.getElementById("orderTotal").textContent = `₱${total.toFixed(2)}`
}

function printOrder() {
  alert("Order printed!")
  currentOrder = []
  updateOrderDisplay()
}

function editOrder() {
  alert("Edit order functionality")
}

// Admin Functions
function loadAdminData() {
  db.collection("bookings")
    .get()
    .then((snapshot) => {
      const bookingsList = document.getElementById("bookingsContainer")
      if (bookingsList) {
        bookingsList.innerHTML = snapshot.docs
          .map(
            (doc) => `
                <div class="booking-card">
                    <h3>${doc.data().customerName}</h3>
                    <p>Date: ${doc.data().date}</p>
                    <p>Time: ${doc.data().time}</p>
                </div>
            `,
          )
          .join("")
      }
    })
}

function showAdminSection(sectionName) {
  document.querySelectorAll(".admin-section").forEach((section) => {
    section.classList.remove("active")
  })
  document
    .getElementById(`admin${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}-section`)
    .classList.add("active")
}

function addMenuItem() {
  document.getElementById("itemModal").classList.add("active")
}

function closeModal() {
  document.getElementById("itemModal").classList.remove("active")
}

// Customer Functions
document.getElementById("loyaltyWheel")?.addEventListener("draw", function () {
  
  const ctx = this.getContext("2d")
  const radius = 150
  const centerX = this.width / 2
  const centerY = this.height / 2
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]

  colors.forEach((color, i) => {
    const startAngle = (i / colors.length) * Math.PI * 2
    const endAngle = ((i + 1) / colors.length) * Math.PI * 2

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fill()
  })
})

function spinLoyaltyWheel() {
  alert("Loyalty wheel spinning...")
}

function confirmBooking() {
  const date = document.getElementById("bookingDate").value
  alert(`Booking confirmed for ${date}`)
  goToCustomerPage("menu")
}

// Setup Event Listeners
function setupEventListeners() {
  // Loyalty wheel canvas
  const canvas = document.getElementById("loyaltyWheel")
  if (canvas) {
    drawLoyaltyWheel(canvas)
  }
}

function drawLoyaltyWheel(canvas) {
  const ctx = canvas.getContext("2d")
  const radius = 140
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
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
