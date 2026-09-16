import { redirect } from 'next/navigation';

export default function ForgotPasswordAlias() {
  redirect('/auth/forgot-password');
}
