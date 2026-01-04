class EmailService {
  private static emails: any[] = [];

  static getAll() {
    return this.emails;
  }

  static send(to: string, subject: string, message: string) {
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

export default EmailService;
  