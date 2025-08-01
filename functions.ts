import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Coupon, User, Suggestion } from './model';
import axios from 'axios';
import * as path from 'path';

// Check if we're in production
const isProd = process.env.NODE_ENV === 'production';

// Base directories
const DATA_DIR = isProd ? '/app/data' : './data';
const DEFAULT_DATA_DIR = './data/default';

// File paths
const COUPONS_FILE = path.join(DATA_DIR, 'coupons.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SUGGESTIONS_FILE = path.join(DATA_DIR, 'suggestions.json');
// const EMAIL_API = 'http://localhost:3001/coupon';
const EMAIL_API = 'https://email-servo.herokuapp.com/coupon';

// Helper function to ensure data directory exists
function ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

// Helper function to initialize a data file from default if it doesn't exist
function initializeDataFile(filename: string) {
    ensureDataDirectory();
    
    if (!fs.existsSync(filename)) {
        const defaultFile = path.join(DEFAULT_DATA_DIR, path.basename(filename));
        if (fs.existsSync(defaultFile)) {
            // In production, only copy if the file doesn't exist
            if (isProd) {
                if (!fs.existsSync(filename)) {
                    fs.copyFileSync(defaultFile, filename);
                }
            } else {
                fs.copyFileSync(defaultFile, filename);
            }
        } else {
            // If no default file exists, create an empty array
            fs.writeFileSync(filename, '[]', 'utf8');
        }
    }
}

// Helper function to safely write to files in production
function safeWriteFile(filename: string, data: any) {
    const tempFile = `${filename}.tmp`;
    try {
        // Write to temporary file first
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
        // Then rename it to the actual file (atomic operation)
        fs.renameSync(tempFile, filename);
    } catch (error) {
        // Clean up temp file if it exists
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
        throw error;
    }
}

// Helper function to send emails
async function sendEmail(email: string, content: string) {
    try {
        await axios.post(EMAIL_API, { email, content });
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// Helper function to format date
function formatDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper functions for file operations
function readCoupons(): Coupon[] {
    initializeDataFile(COUPONS_FILE);
    try {
        const data = fs.readFileSync(COUPONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeCoupons(coupons: Coupon[]): void {
    safeWriteFile(COUPONS_FILE, coupons);
}

function readUsers(): User[] {
    initializeDataFile(USERS_FILE);
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeUsers(users: User[]): void {
    safeWriteFile(USERS_FILE, users);
}

function readSuggestions(): Suggestion[] {
    initializeDataFile(SUGGESTIONS_FILE);
    try {
        const data = fs.readFileSync(SUGGESTIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeSuggestions(suggestions: Suggestion[]): void {
    safeWriteFile(SUGGESTIONS_FILE, suggestions);
}

// Coupon Functions
export function addCoupon(userIds: string[], title: string, content: string, adminId: string): Coupon[] {
    const coupons = readCoupons();
    const newCoupons: Coupon[] = [];
    const users = readUsers();
    const admin = users.find(u => u.id === adminId);
    
    userIds.forEach(userId => {
        const user = users.find(u => u.id === userId);
        const coupon: Coupon = {
            id: uuidv4(),
            userId: userId,
            adminId: adminId,
            title: title,
            content: content,
            isActive: false,
            scheduledDate: null
        };
        coupons.push(coupon);
        newCoupons.push(coupon);

        // Send email to user about new coupon
        if (user) {
            const emailContent = `
                <h3>New Coupon Created For You!</h3>
                <p>Hello ${user.firstName},</p>
                <p>${admin?.firstName} ${admin?.lastName} has created a new coupon for you:</p>
                <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
                    <h4>${title}</h4>
                    <p>${content}</p>
                </div>
                <p>Log in to your Simple Coupon Book to view and manage your coupons!</p>
            `;
            sendEmail(user.email, emailContent);
        }
    });
    
    writeCoupons(coupons);
    return newCoupons;
}

export function deleteCoupon(couponId: string): boolean {
  const coupons = readCoupons();
  const index = coupons.findIndex(coupon => coupon.id === couponId);
  
  if (index === -1) {
    return false;
  }
  
  coupons.splice(index, 1);
  writeCoupons(coupons);
  return true;
}

export function redeemCoupon(couponId: string, date?: Date): Coupon | null {
    const coupons = readCoupons();
    const coupon = coupons.find(c => c.id === couponId);
    
    if (!coupon) {
        return null;
    }
    
    const users = readUsers();
    const user = users.find(u => u.id === coupon.userId);
    const admin = users.find(u => u.id === coupon.adminId);
    
    coupon.isActive = true;
    if (date) {
        coupon.scheduledDate = date;
    }
    
    // Send email to both user and admin
    if (user && admin) {
        const userEmailContent = `
            <h3>Your Coupon is Now Active!</h3>
            <p>Hello ${user.firstName},</p>
            <p>Your coupon "${coupon.title}" is now active and ready to be used.</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h4>${coupon.title}</h4>
                <p>${coupon.content}</p>
                ${date ? `<p>Scheduled for: ${formatDate(date)}</p>` : ''}
            </div>
        `;
        sendEmail(user.email, userEmailContent);

        const adminEmailContent = `
            <h3>Coupon Activated</h3>
            <p>Hello ${admin.firstName},</p>
            <p>${user.firstName} ${user.lastName} has activated their coupon "${coupon.title}"</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h4>${coupon.title}</h4>
                <p>${coupon.content}</p>
                ${date ? `<p>Scheduled for: ${formatDate(date)}</p>` : ''}
            </div>
        `;
        sendEmail(admin.email, adminEmailContent);
    }
    
    writeCoupons(coupons);
    return coupon;
}

export function scheduleCoupon(couponId: string, date: Date): Coupon | null {
    const coupons = readCoupons();
    const coupon = coupons.find(c => c.id === couponId);
    
    if (!coupon) {
        return null;
    }
    
    const users = readUsers();
    const user = users.find(u => u.id === coupon.userId);
    const admin = users.find(u => u.id === coupon.adminId);
    
    coupon.scheduledDate = date;
    
    // Send email notifications about scheduling
    if (user && admin) {
        const userEmailContent = `
            <h3>Your Coupon Has Been Scheduled</h3>
            <p>Hello ${user.firstName},</p>
            <p>Your coupon "${coupon.title}" has been scheduled.</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h4>${coupon.title}</h4>
                <p>${coupon.content}</p>
                <p>Scheduled for: ${formatDate(date)}</p>
            </div>
        `;
        sendEmail(user.email, userEmailContent);

        const adminEmailContent = `
            <h3>Coupon Scheduled</h3>
            <p>Hello ${admin.firstName},</p>
            <p>${user.firstName} ${user.lastName} has scheduled their coupon "${coupon.title}"</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h4>${coupon.title}</h4>
                <p>${coupon.content}</p>
                <p>Scheduled for: ${formatDate(date)}</p>
            </div>
        `;
        sendEmail(admin.email, adminEmailContent);
    }
    
    writeCoupons(coupons);
    return coupon;
}

export function listCoupons(userId?: string, isAdmin: boolean = false): Coupon[] {
    const coupons = readCoupons();
    
    // If not admin, only return coupons for the specific user
    if (!isAdmin && userId) {
        return coupons.filter(coupon => coupon.userId === userId);
    }
    
    // If admin and userId provided, filter by that user
    if (isAdmin && userId) {
        return coupons.filter(coupon => coupon.userId === userId);
    }
    
    // If admin and no userId, return all coupons
    return coupons;
}

// User Functions
export function addUser(firstName: string, lastName: string, email: string, password: string, isAdmin: boolean = false): User {
  const users = readUsers();
  
  const user: User = {
    id: uuidv4(),
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    isAdmin: Boolean(isAdmin)
  };
  
  users.push(user);
  writeUsers(users);
  return user;
}

export function editUser(userId: string, updates: Partial<Omit<User, 'id'>>): User | null {
  const users = readUsers();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    return null;
  }
  
  // Ensure isAdmin is properly converted to boolean if it's being updated
  if (updates.hasOwnProperty('isAdmin')) {
    updates.isAdmin = Boolean(updates.isAdmin);
  }
  
  users[userIndex] = { ...users[userIndex], ...updates };
  writeUsers(users);
  return users[userIndex];
}

export function deleteUser(userId: string): boolean {
  const users = readUsers();
  const index = users.findIndex(user => user.id === userId);
  
  if (index === -1) {
    return false;
  }
  
  users.splice(index, 1);
  writeUsers(users);
  return true;
}

export function getUser(userId: string): User | null {
  const users = readUsers();
  return users.find(user => user.id === userId) || null;
}

export function getAllUsers(): User[] {
  return readUsers();
}

export function loginUser(email: string, password: string): User | null {
  const users = readUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  return user || null;
}

// Suggestion Functions
export function addSuggestion(userId: string, content: string): Suggestion {
    const suggestions = readSuggestions();
    const users = readUsers();
    const user = users.find(u => u.id === userId);
    
    const suggestion: Suggestion = {
        id: uuidv4(),
        userId: userId,
        content: content,
        createdAt: new Date()
    };
    
    suggestions.push(suggestion);
    writeSuggestions(suggestions);

    // Send email to all admins about the new suggestion
    const admins = users.filter(u => u.isAdmin);
    admins.forEach(admin => {
        const emailContent = `
            <h3>New Suggestion Received</h3>
            <p>Hello ${admin.firstName},</p>
            <p>A new suggestion has been submitted by ${user?.firstName} ${user?.lastName}:</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <p>${content}</p>
                <p><small>Submitted on: ${formatDate(suggestion.createdAt)}</small></p>
            </div>
            <p>Log in to your Simple Coupon Book to review all suggestions.</p>
        `;
        sendEmail(admin.email, emailContent);
    });
    
    return suggestion;
}

export function getAllSuggestions(): Suggestion[] {
  return readSuggestions();
}

export function deleteSuggestion(suggestionId: string): boolean {
  const suggestions = readSuggestions();
  const index = suggestions.findIndex(suggestion => suggestion.id === suggestionId);
  
  if (index === -1) {
    return false;
  }
  
  suggestions.splice(index, 1);
  writeSuggestions(suggestions);
  return true;
}
