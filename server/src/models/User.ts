import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import mongoose, { Document, Schema } from 'mongoose';

// Define interface for User document
// Ensure properties match your schema and add methods
export interface UserDocument extends Document {
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member'; // Adjust roles as needed
  createdAt: Date;
  avatar?: string;
  // Make password optional as it might not be selected in all queries
  // and it's definitely not present after pre-save hashing if it wasn't modified.
  password?: string;
  getSignedJwtToken(): string;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'member'],
    default: 'member'
  },
  avatar: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
UserSchema.pre<UserDocument>('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    if (error instanceof Error) {
      return next(error);
    }
    return next(new Error('Error hashing password'));
  }
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function(this: UserDocument): string {
  const jwtSecret: Secret = process.env.JWT_SECRET || '';
  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in environment variables.');
    throw new Error('Server configuration error: JWT secret not set.');
  }

  const defaultExpirationSeconds = 30 * 24 * 60 * 60;

  let expiresInSeconds = defaultExpirationSeconds;
  const jwtExpireEnv = process.env.JWT_EXPIRE;
  if (jwtExpireEnv) {
    if (typeof jwtExpireEnv === 'string' && /^\d+$/.test(jwtExpireEnv)) {
      expiresInSeconds = parseInt(jwtExpireEnv, 10);
    } else if (typeof jwtExpireEnv === 'string') {
      const match = jwtExpireEnv.match(/^(\d+)d$/);
      if (match && match[1]) {
        expiresInSeconds = parseInt(match[1], 10) * 24 * 60 * 60;
      } else {
        console.warn(`Could not parse JWT_EXPIRE value "${jwtExpireEnv}", using default.`);
      }
    }
  }

  const options: SignOptions = {
    expiresIn: expiresInSeconds
  };

  return jwt.sign(
    { id: this._id },
    jwtSecret,
    options
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(
  this: UserDocument,
  enteredPassword: string
): Promise<boolean> {
  if (!this.password) {
    console.error(`Attempted to match password for user ${this._id} without fetching password field.`);
    throw new Error('Password field not available for comparison.');
  }
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
};

export default mongoose.model<UserDocument>('User', UserSchema);