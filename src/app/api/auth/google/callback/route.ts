import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '../../../../gmail/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get('code');
		const state = searchParams.get('state');
		const error = searchParams.get('error');

		// Check for errors from Google
		if (error) {
			console.error('Google auth error:', error);
			return NextResponse.redirect('?error=auth_denied');
		}

		if (!code) {
			return NextResponse.redirect(');
		}

		// Verify state to prevent CSRF
		const cookieStore = await cookies();
		const savedState = cookieStore.get('gmail_auth_state')?.value;

		if (!savedState || savedState !== state) {
			console.error('State mismatch');
			return NextResponse.redirect('smatch');
		}

		// Exchange code for tokens
		const tokens = await getTokensFromCode(code);

		// Store tokens in cookies (in production, use a secure database)
		const response = NextResponse.redirect('');

		// Store tokens securely
		response.cookies.set('gmail_tokens', JSON.stringify(tokens), {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});

		// Clear the state cookie
		response.cookies.delete('gmail_auth_state');

		return response;
	} catch (error) {
		console.error('Error in Google callback:', error);
		return NextResponse.redirect('change_failed');
	}
}
