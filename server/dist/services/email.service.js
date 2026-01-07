"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EmailService {
    static getAll() {
        return this.emails;
    }
    static send(to, subject, message) {
        const email = {
            id: this.emails.length + 1,
            to,
            subject,
            message,
            date: new Date(),
        };
        this.emails.push(email);
        return email;
    }
}
EmailService.emails = [];
exports.default = EmailService;
