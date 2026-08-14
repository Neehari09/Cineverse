export const STORAGE_KEY = 'cineverse_bookings';

export function getStoredBookings() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
}

export function saveBookings(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addBooking(booking) {
    const existing = getStoredBookings();
    saveBookings([booking, ...existing]);
}
