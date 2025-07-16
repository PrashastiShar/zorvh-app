import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom'; // Use passport-custom for Firebase ID Token verification
import { Request } from 'express'; // Import Request from express
import * as admin from 'firebase-admin'; // Firebase Admin SDK

// Define the shape of the Firebase ID Token payload
export interface FirebaseJwtPayload {
  uid: string; // Firebase User ID
  email?: string;
  // Add other fields from the Firebase ID Token payload if you need them
  // e.g., name, picture, email_verified, firebase.sign_in_provider
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
    super(); // Passport-custom strategy doesn't take options in super()
  }

  // The validate method for passport-custom strategy receives the request object
  async validate(req: Request): Promise<FirebaseJwtPayload> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Missing or malformed Authorization header.');
      throw new UnauthorizedException('No token provided.');
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
      // Verify the Firebase ID Token using Firebase Admin SDK
      // The Firebase Admin SDK handles fetching Google's public keys and verifying the signature.
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Check if the token is revoked or if the user is disabled
      // This is optional but recommended for stronger security
      // const userRecord = await admin.auth().getUser(decodedToken.uid);
      // if (userRecord.disabled) {
      //   throw new UnauthorizedException('User account is disabled.');
      // }

      // Return the payload data that you want to attach to req.user
      // Ensure 'uid' is always present as it's critical for authorization rules
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        // Add other relevant fields from decodedToken if needed
      };
    } catch (error) {
      this.logger.error(`Firebase ID Token verification failed: ${error.message}`, error.stack);
      // More specific error messages for debugging:
      if (error.code === 'auth/argument-error') {
        throw new UnauthorizedException('Invalid ID token string or format.');
      } else if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException('ID token has expired.');
      } else if (error.code === 'auth/id-token-revoked') {
        throw new UnauthorizedException('ID token has been revoked.');
      }
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
