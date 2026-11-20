from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Project
from .serializers import ProjectSerializer

POPULAR_TECH_STACKS = {
    'categories': [
        {
            'name': 'Frontend',
            'items': [
                'Next.js',
                'React',
                'TypeScript',
                'Tailwind CSS',
                'Vue.js',
                'Nuxt.js',
                'Svelte',
                'Angular',
            ],
        },
        {
            'name': 'Backend',
            'items': [
                'Django',
                'FastAPI',
                'Python',
                'Node.js',
                'Express.js',
                'NestJS',
                'Go',
                'Spring Boot',
            ],
        },
        {
            'name': 'Databases',
            'items': [
                'PostgreSQL',
                'MongoDB',
                'Redis',
                'SQLite',
                'MySQL',
                'Supabase',
                'Firebase',
            ],
        },
        {
            'name': 'Cloud & DevOps',
            'items': [
                'Docker',
                'Kubernetes',
                'AWS',
                'Vercel',
                'Google Cloud',
            ],
        },
        {
            'name': 'AI & APIs',
            'items': [
                'Gemini API',
                'OpenAI API',
                'LangChain',
                'GraphQL',
                'REST API',
            ],
        },
    ],
    'popular': [
        'Next.js',
        'React',
        'TypeScript',
        'Tailwind CSS',
        'Django',
        'FastAPI',
        'Python',
        'Node.js',
        'PostgreSQL',
        'MongoDB',
        'Redis',
        'Supabase',
        'Docker',
        'AWS',
        'Gemini API',
    ],
}


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='tech-stacks', permission_classes=[AllowAny])
    def tech_stacks(self, request):
        return Response(POPULAR_TECH_STACKS)
