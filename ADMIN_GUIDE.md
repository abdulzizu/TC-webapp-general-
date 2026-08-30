# Thrift Collision — Admin Guide

A plain-English guide to running the store from the dashboard. No coding needed. If you can use Instagram and online banking, you can use this.

The dashboard lives at **`/admin`** (e.g. `https://www.thriftcollision.com/admin`).

---

## Signing in

1. Go to `/admin`. You'll be sent to the login page.
2. Enter your admin email and password.
3. You stay signed in for 24 hours, then you'll need to log in again.
4. Too many wrong password attempts locks you out for 15 minutes — this protects the store from break-in attempts.
5. To sign out, use **Sign out** at the bottom of the left sidebar.

> Admin accounts are separate from customer accounts. A customer signing in on the store cannot reach the dashboard.

---

## The sidebar — what each section does

| Section | What it's for |
|---------|---------------|
| 📊 **Overview** | Your dashboard home. Key numbers at a glance. |
| 👕 **Products** | Add, edit, and manage every item in the store. |
| 📈 **Stock** | Track what's available, sold, and hidden. |
| 📦 **Orders** | See and manage every customer order. |
| 👥 **Customers** | Your customer list. |
| 💬 **Reviews** | Approve or reject customer reviews before they go public. |
| 🎯 **Demand** | See what people are searching for and wanting. |
| 📋 **Leads** | People who signed up to be notified about drops. |
| 🏷️ **Discounts** | Create and manage discount codes. |
| ⭐ **Featured** | Choose which products appear in the homepage spotlight. |
| 🔥 **Drops** | Plan and schedule timed product drops. |
| 🚚 **Shipping** | Set delivery zones and their costs. |
| ⚙️ **Settings** | Store-wide settings and your admin password. |

---

## Overview (your home screen)

The top shows eight quick numbers:
- **Total Products**, **Available**, **Sold**
- **Total Orders**, **Processing** (paid, needs action)
- **Customers**, **Drop Leads**
- **Revenue** (total from all orders that weren't marked unsuccessful)

Below that:
- **Stockpile deadline alerts** — a yellow box warning you when a customer's stockpiled order is within 5 days of its deadline. Red means 2 days or less. Act on these so items don't sit held forever.
- **Recent Orders** — the last five orders with their status and total.

---

## Products

This is where your catalogue lives. Each item is **one-of-one** — a single piece, in one size. Once it sells, there's no "restock."

Typical tasks:
- **Add an item:** upload the photo, fill in name, category, price, size, colours. There's an **AI helper** that looks at the photo and drafts the name, category, colours and a description for you (written in the brand's voice) — you review and tweak before saving.
- **Tags** control the little labels shown on an item: `NEW`, `2 LEFT`, `1 LEFT`, `SOLD`, `ESSENTIAL`, `STAFF PICK`.
- **Available** controls whether the item shows in the shop at all.

---

## Stock

A focused view of availability — what's live, what's sold, what's hidden. Use this when you want to see the health of your inventory without scrolling the full product list. It's also where hidden items show up (handy when you're setting up a drop and want to see everything you have to work with).

---

## Orders — the important one

Every order lands here. Click an order to expand it and see the customer, delivery address, the items (with photos), and the full price breakdown.

**Order statuses and what they mean:**

| Status | Meaning |
|--------|---------|
| **pending** | Order created, payment not yet confirmed |
| **processing** | Paid — needs to be packed and sent |
| **stockpiled** | Paid, but the customer chose to hold items (stockpile) rather than ship now |
| **shipped** | On its way |
| **delivered** | Arrived |
| **unsuccessful** | Payment failed / cancelled (doesn't count toward revenue) |

**Updating a status:** open the order, scroll to **Update Status**, tap the new status.

**Two things happen automatically when you mark an order `delivered`:**
1. The items in that order are **hidden from the store** (they're gone — no need to hide them by hand).
2. A **review-request email** is sent to the customer (if they gave an email), inviting them to leave a review. The link takes them to a form with their order ID already filled in.

> If a customer checked out without an email, no review email can be sent — there's nowhere to send it. Signed-in customers always have an email, so they'll always get it.

**Search & filter:** filter by status along the top, or search by order ID, name, phone, or address. There's also a small hint on an order if the same phone or name appears on other orders — useful for spotting repeat customers.

---

## Reviews

Reviews are **text-only** (no star ratings) and are **moderated** — nothing appears on the website until you approve it. This protects you from spam and fake reviews.

**The flow:**
1. A customer submits a review (usually via the email they get when their order is delivered). It arrives as **pending**.
2. In **Reviews**, use the tabs to filter: pending / approved / rejected / all.
3. For each review you can **Approve** or **Reject** (or **Delete**).
4. Once a review is **approved**, a **Feature on homepage** toggle appears. Turn it on to show that review in the spotlight section on the homepage.

**Where reviews show up:**
- **Approved** reviews appear on the public **Reviews page** (`/reviews`, linked in the footer).
- **Approved + Featured** reviews also appear in the reviews section on the **homepage**.
- The homepage reviews section **hides itself completely** when nothing is featured — so the store never looks empty or untested.

Reviews show the customer's **first name only** and a "✓ Verified purchase" badge. If they added a photo it's used as their avatar; if not, a coloured circle with their initial is shown.

---

## Customers

Your list of people who've created accounts. Handy for understanding who's shopping and reaching out when needed.

---

## Demand & Leads

- **Demand** — signals about what people want (searches, interest). Use it to decide what to source next.
- **Leads** — people who signed up to be notified about drops. When you launch a drop, these are the people you can alert.

---

## Discounts

Create discount codes here (e.g. a launch promo). Codes are applied by customers at checkout and reduce the order total.

---

## Featured

Pick the products that appear in the homepage spotlight (the rotating hero items). Use this to push the pieces you most want to sell.

---

## Drops

Drops are timed releases of a batch of items. Plan and schedule them here. When a drop goes live, you can notify your leads — and customers who saved matching wishlist keywords can be alerted automatically that something they wanted just dropped.

> Tip: when building a new drop, check the **Stock** section to make sure you can see every hidden item you might want to include.

---

## Shipping

Set your delivery **zones** and the cost for each. There's also a free-shipping threshold (spend over a set amount and shipping is free) controlled in store settings.

---

## Settings

Store-wide configuration and your admin password. **Change your password** here — pick something strong and don't reuse it elsewhere.

---

## Everyday checklist

**Daily**
- Check **Overview** for new **Processing** orders and stockpile deadline warnings.
- Pack & mark **Processing** orders as **shipped**, then **delivered** once they arrive.

**When reviews come in**
- Open **Reviews → Pending**, approve the good ones, feature the best on the homepage.

**Before a drop**
- Use **Stock**/**Products** to prep items, set them up in **Drops**, and line up your **Leads**.

---

## Good to know

- Every item is one-of-one. Marking an order **delivered** hides its items automatically — that's expected.
- Reviews never go public on their own; you're always the gatekeeper.
- The homepage reviews section stays hidden until you feature at least one review.
- Revenue on the Overview excludes **unsuccessful** orders.
