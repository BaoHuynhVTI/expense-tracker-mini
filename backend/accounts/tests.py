"""Tests for the accounts (authentication) app."""
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class RegisterTests(APITestCase):
    def test_register_success(self):
        url = reverse("register")
        payload = {
            "email": "alice@example.com",
            "password": "supersecret",
            "password_confirm": "supersecret",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "alice@example.com")
        user = User.objects.get(email="alice@example.com")
        self.assertEqual(user.username, "alice@example.com")
        self.assertTrue(user.check_password("supersecret"))

    def test_cannot_register_duplicate_email(self):
        User.objects.create_user(
            username="alice@example.com",
            email="alice@example.com",
            password="supersecret",
        )
        url = reverse("register")
        payload = {
            "email": "alice@example.com",
            "password": "anothersecret",
            "password_confirm": "anothersecret",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch(self):
        url = reverse("register")
        payload = {
            "email": "bob@example.com",
            "password": "supersecret",
            "password_confirm": "different1",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_short_password(self):
        url = reverse("register")
        payload = {
            "email": "bob@example.com",
            "password": "short",
            "password_confirm": "short",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="carol@example.com",
            email="carol@example.com",
            password="supersecret",
        )

    def test_login_success(self):
        url = reverse("login")
        payload = {"email": "carol@example.com", "password": "supersecret"}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "carol@example.com")

    def test_login_wrong_password(self):
        url = reverse("login")
        payload = {"email": "carol@example.com", "password": "wrongpass"}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class MeTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="dave@example.com",
            email="dave@example.com",
            password="supersecret",
        )

    def test_me_requires_authentication(self):
        url = reverse("me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "dave@example.com")
        self.assertEqual(response.data["id"], self.user.id)
