import { expect, Page, test } from '@playwright/test';

/** Fails the test on uncaught errors in the page. */
const watchErrors = (page: Page) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    return errors;
};

test('main menu loads', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    for (const item of ['Sureler', 'Namaz Vakitleri', 'Hicri Takvim', 'Tefsir']) {
        await expect(page.getByText(item, { exact: true }).first()).toBeVisible();
    }
    expect(errors).toEqual([]);
});

test('static pages for the stores are served', async ({ page }) => {
    await page.goto('/privacy.html');
    await expect(page).toHaveTitle('Gizlilik Politikası — Kuran360');
    await expect(page.getByText('Profil → Hesabı Sil')).toBeVisible();
    await page.goto('/support.html');
    await expect(page).toHaveTitle('Destek — Kuran360');
    await expect(page.getByRole('link', { name: 'gizlilik politikasına' })).toHaveAttribute('href', '/privacy.html');
});

test('prayer times load from the Diyanet data', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/prayer-times');
    await expect(page.getByText('Ezan Vakitleri')).toBeVisible();
    for (const name of ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı']) {
        await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    }
    // A time like 06:24 shows once the data has loaded
    await expect(page.getByText(/^\d{2}:\d{2}$/).first()).toBeVisible();
    expect(errors).toEqual([]);
});

test('hijri calendar opens by its link', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/hijri-calendar');
    await expect(page.getByText('Hicri Takvim').first()).toBeVisible();
    await expect(page.getByText(/[0-9٠-٩]{4} هـ/).first()).toBeVisible();
    expect(errors).toEqual([]);
});

test('download the verses, then read and search them', async ({ page }) => {
    test.setTimeout(180_000);
    const errors = watchErrors(page);

    await page.goto('/surahs');
    await page.getByText('Meal Verilerini İndir').click();
    // The page reloads itself once the data is stored
    await expect(page.getByText('İhlas', { exact: false }).first()).toBeVisible({ timeout: 150_000 });

    await page.goto('/surah/112');
    await expect(page).toHaveURL(/\/surah\/112\/verse\/1$/);
    await expect(page.getByText('De ki: “O, Allah’tır, tektir.')).toBeVisible();
    await expect(page.getByText('Doğurmamış ve doğmamıştır.')).toBeVisible();

    await page.goto('/search');
    await page.getByPlaceholder('Aranacak kelime veya cümle...').fill('samed');
    await expect(page.getByText('İhlas - Ayet 2')).toBeVisible();

    expect(errors).toEqual([]);
});
