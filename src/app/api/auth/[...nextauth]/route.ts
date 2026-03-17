import { handlers } from "@/auth";

type AuthHandlerRequest = Parameters<typeof handlers.GET>[0];

export async function GET(request: AuthHandlerRequest) {
	return handlers.GET(request);
}

export async function POST(request: AuthHandlerRequest) {
	return handlers.POST(request);
}