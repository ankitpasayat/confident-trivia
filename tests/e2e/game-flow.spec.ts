import { test, expect } from '@playwright/test';

test.describe('Game Flow E2E Tests', () => {
  test('complete game flow from creation to results', async ({ page, context }) => {
    // Host creates game
    await page.goto('/');
    await page.click('button:has-text("Host New Game")');
    await page.fill('input[type="text"]', 'Alice');
    await page.click('button:has-text("Create Game")');

    // Wait for lobby and get game code
    await expect(page.locator('text=Game Code')).toBeVisible();
    const gameCodeElement = page.getByTestId('game-code');
    await expect(gameCodeElement).toBeVisible();
    const gameCode = await gameCodeElement.textContent();
    // Game code can include letters and numbers (excluding confusing chars like I, O, 0, 1)
    expect(gameCode).toMatch(/^[A-Z0-9]{4}$/);

    // Open second tab for Player 2
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.click('button:has-text("Join Game")');
    
    // Fill in join form - name first, then code
    const nameInputs = page2.locator('input[type="text"]');
    await nameInputs.first().fill('Bob');
    await nameInputs.nth(1).fill(gameCode!);
    await page2.click('button:has-text("Join Game")');

    // Both players should see each other in lobby
    await expect(page.locator('text=Alice')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Bob')).toBeVisible({ timeout: 10000 });
    await expect(page2.locator('text=Alice')).toBeVisible({ timeout: 10000 });
    await expect(page2.locator('text=Bob')).toBeVisible({ timeout: 10000 });

    // Verify player count
    await expect(page.locator('text=/Players \\(2\\/6\\)/')).toBeVisible();

    // Host starts game (button should now be enabled)
    const startButton = page.locator('button:has-text("Start Game")');
    await expect(startButton).toBeEnabled();
    await startButton.click();

    // Both should see question phase
    await expect(page.locator('text=/Round 1/')).toBeVisible({ timeout: 10000 });
    await expect(page2.locator('text=/Round 1/')).toBeVisible({ timeout: 10000 });

    // Host clicks "Start Voting!"
    await page.click('button:has-text("Start Voting!")');

    // Wait for voting phase
    await expect(page.locator('text=/Select Token/')).toBeVisible({ timeout: 10000 });
    await expect(page2.locator('text=/Select Token/')).toBeVisible({ timeout: 10000 });

    // Select answer and token for both players
    // Alice votes
    await page.locator('button').filter({ hasText: /^A\./ }).first().click();
    await page.waitForTimeout(500); // Allow React state to update
    const aliceTokenButton = page.locator('button').filter({ hasText: /^5$/ }).first();
    await expect(aliceTokenButton).toBeVisible({ timeout: 5000 });
    await aliceTokenButton.click();
    await page.waitForTimeout(500); // Allow button text to update
    await expect(page.locator('button:has-text("Submit Vote")')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Submit Vote")');

    // Bob votes
    await page2.locator('button').filter({ hasText: /^A\./ }).first().click();
    await page2.waitForTimeout(500); // Allow React state to update
    const bobTokenButton = page2.locator('button').filter({ hasText: /^7$/ }).first();
    await expect(bobTokenButton).toBeVisible({ timeout: 5000 });
    await bobTokenButton.click();
    await page2.waitForTimeout(500); // Allow button text to update
    await expect(page2.locator('button:has-text("Submit Vote")')).toBeVisible({ timeout: 5000 });
    await page2.click('button:has-text("Submit Vote")');

    // Should show reveal phase with results
    await expect(page.locator('text=/Correct Answer/i')).toBeVisible({ timeout: 10000 });
    await expect(page2.locator('text=/Correct Answer/i')).toBeVisible({ timeout: 10000 });

    // Verify scores are visible (multiple players have 'total' text)
    await expect(page.locator('text=/total/').first()).toBeVisible();

    await page2.close();
  });

  test('should not allow starting game with insufficient players', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Host New Game")');
    await page.fill('input[type="text"]', 'Host');
    await page.click('button:has-text("Create Game")');

    // Wait for lobby
    await expect(page.locator('text=Game Code')).toBeVisible();

    // Start button should be disabled and show waiting message
    const startButton = page.locator('button:has-text("Waiting for players...")');
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeDisabled();
  });

  test('should not allow joining with invalid code', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Join Game")');
    
    const nameInputs = page.locator('input[type="text"]');
    await nameInputs.first().fill('Player');
    await nameInputs.nth(1).fill('XXXX');
    await page.click('button:has-text("Join Game")');

    // Should show error message
    await expect(page.locator('text=/game not found|not found or already started/i')).toBeVisible();
  });

  test('should prevent joining game that is full', async ({ page, context }) => {
    // Create game
    await page.goto('/');
    await page.click('button:has-text("Host New Game")');
    await page.fill('input[type="text"]', 'Host');
    await page.click('button:has-text("Create Game")');

    await expect(page.locator('text=Game Code')).toBeVisible();
    const gameCodeElement = page.getByTestId('game-code');
    const gameCode = await gameCodeElement.textContent();

    // Add 5 more players (total 6) - close immediately after joining to free up resources
    for (let i = 1; i <= 5; i++) {
      const playerPage = await context.newPage();
      await playerPage.goto('/');
      await playerPage.click('button:has-text("Join Game")');
      
      const inputs = playerPage.locator('input[type="text"]');
      await inputs.first().fill(`Player${i}`);
      await inputs.nth(1).fill(gameCode!);
      await playerPage.click('button:has-text("Join Game")');
      
      await expect(playerPage.locator(`text=Player${i}`)).toBeVisible({ timeout: 10000 });
      await playerPage.close();
      
      // Small delay to ensure state update
      await page.waitForTimeout(100);
    }

    // Verify player count shows 6/6
    await expect(page.locator('text=/Players \\(6\\/6\\)/')).toBeVisible();

    // 7th player should fail to join
    const page7 = await context.newPage();
    await page7.goto('/');
    await page7.click('button:has-text("Join Game")');
    
    const inputs7 = page7.locator('input[type="text"]');
    await inputs7.first().fill('Player7');
    await inputs7.nth(1).fill(gameCode!);
    await page7.click('button:has-text("Join Game")');

    // Should show error message that game is full
    await expect(page7.locator('text=/Game is full/i')).toBeVisible({ timeout: 5000 });
    
    // Cleanup
    await page7.close();
  });

  test('mobile: should be responsive on small screens', async ({ page, viewport }) => {
    test.skip(viewport === null || viewport.width > 768, 'This test is for mobile only');

    await page.goto('/');

    // Check mobile layout
    const createButton = page.locator('button:has-text("Host New Game")');
    const joinButton = page.locator('button:has-text("Join Game")');

    await expect(createButton).toBeVisible();
    await expect(joinButton).toBeVisible();

    // Buttons should be touch-friendly (44px min per touch-target class)
    const createBox = await createButton.boundingBox();
    expect(createBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('should handle disconnection and reconnection', async ({ page, context }) => {
    // Create game
    await page.goto('/');
    await page.click('button:has-text("Host New Game")');
    await page.fill('input[type="text"]', 'Host');
    await page.click('button:has-text("Create Game")');

    await expect(page.locator('text=Game Code')).toBeVisible();
    const gameCodeElement = page.getByTestId('game-code');
    const gameCode = await gameCodeElement.textContent();
    
    // Wait for navigation to complete before accessing localStorage
    await page.waitForURL('**/game/*');
    const sessionId = await page.evaluate(() => localStorage.getItem('sessionId'));

    // Player joins
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.click('button:has-text("Join Game")');
    
    const inputs = page2.locator('input[type="text"]');
    await inputs.first().fill('Player2');
    await inputs.nth(1).fill(gameCode!);
    await page2.click('button:has-text("Join Game")');

    await expect(page.locator('text=Player2')).toBeVisible({ timeout: 10000 });
    
    // Wait for page2 to navigate to game page before accessing localStorage
    await page2.waitForURL('**/game/*');
    // Get player ID before disconnect
    const playerId = await page2.evaluate(() => localStorage.getItem('playerId'));

    // Simulate player 2 disconnecting
    await page2.close();

    // Wait a moment
    await page.waitForTimeout(2000);

    // Create new page with same player data (reconnection)
    const page2Reconnect = await context.newPage();
    
    // Navigate first, then set localStorage (can't access localStorage on about:blank)
    await page2Reconnect.goto(`/game/${sessionId}`);
    
    // Restore player state
    await page2Reconnect.evaluate(({ sid, pid }) => {
      localStorage.setItem('sessionId', sid!);
      localStorage.setItem('playerId', pid!);
      localStorage.setItem('playerName', 'Player2');
    }, { sid: sessionId, pid: playerId });
    
    // Reload to apply localStorage
    await page2Reconnect.reload();

    // Should reconnect successfully - player still in lobby
    await expect(page2Reconnect.locator('text=Player2')).toBeVisible({ timeout: 10000 });

    await page2Reconnect.close();
  });

  test('should complete full game and show results', async ({ page, context }) => {
    // This is a longer test - set timeout
    test.setTimeout(120000);

    // Create and start game
    await page.goto('/');
    await page.click('button:has-text("Host New Game")');
    await page.fill('input[type="text"]', 'Alice');
    await page.click('button:has-text("Create Game")');

    await expect(page.locator('text=Game Code')).toBeVisible();
    const gameCodeElement = page.getByTestId('game-code');
    const gameCode = await gameCodeElement.textContent();

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.click('button:has-text("Join Game")');
    
    const inputs = page2.locator('input[type="text"]');
    await inputs.first().fill('Bob');
    await inputs.nth(1).fill(gameCode!);
    await page2.click('button:has-text("Join Game")');

    await expect(page.locator('text=Bob')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Start Game")');

    // Play through 5 rounds (game default)
    for (let round = 1; round <= 5; round++) {
      console.log(`Playing round ${round}`);
      
      // Question phase
      await expect(page.locator(`text=Round ${round}`)).toBeVisible({ timeout: 15000 });
      await expect(page2.locator(`text=Round ${round}`)).toBeVisible({ timeout: 15000 });
      
      // Host starts voting
      await page.click('button:has-text("Start Voting!")');

      // Wait for voting phase
      await expect(page.locator('text=/Select Token/i')).toBeVisible({ timeout: 10000 });
      await expect(page2.locator('text=/Select Token/i')).toBeVisible({ timeout: 10000 });

      // Both players vote
      const tokenValue = Math.min(round, 10); // Use token 1-5 for rounds 1-5
      
      // Alice votes
      await page.locator('button').filter({ hasText: /^A\./ }).first().click();
      await page.waitForTimeout(500); // Allow React state to update
      const aliceTokenButton = page.locator('button').filter({ hasText: new RegExp(`^${tokenValue}$`) }).first();
      await expect(aliceTokenButton).toBeVisible({ timeout: 5000 });
      await aliceTokenButton.click();
      await page.waitForTimeout(500); // Allow button text to update
      await expect(page.locator('button:has-text("Submit Vote")')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("Submit Vote")');

      // Bob votes
      await page2.locator('button').filter({ hasText: /^A\./ }).first().click();
      await page2.waitForTimeout(500); // Allow React state to update
      const bobTokenButton = page2.locator('button').filter({ hasText: new RegExp(`^${11 - tokenValue}$`) }).first();
      await expect(bobTokenButton).toBeVisible({ timeout: 5000 });
      await bobTokenButton.click();
      await page2.waitForTimeout(500); // Allow button text to update
      await expect(page2.locator('button:has-text("Submit Vote")')).toBeVisible({ timeout: 5000 });
      await page2.click('button:has-text("Submit Vote")');



      // Wait for reveal
      await expect(page.locator('text=/Correct Answer/i')).toBeVisible({ timeout: 10000 });
      await expect(page2.locator('text=/Correct Answer/i')).toBeVisible({ timeout: 10000 });
      
      // Verify scores are visible (multiple players have 'total' text)
      await expect(page.locator('text=/total/i').first()).toBeVisible();
      
      if (round < 5) {
        await page.click('button:has-text("Next Question")');
        await page.waitForTimeout(1000); // Small delay between rounds
      }
    }

    // Should show final results
    await expect(page.locator('text=/Final Results|results/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Alice')).toBeVisible();
    await expect(page.locator('text=Bob')).toBeVisible();

    await page2.close();
  });
});

test.describe('UI/UX Tests', () => {
  test('should show loading states', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Host New Game")');
    await page.fill('input[type="text"]', 'Host');
    
    // Click and immediately check for loading state
    const createButton = page.locator('button:has-text("Create Game")');
    await createButton.click();

    // Button should show loading text
    await expect(page.locator('button:has-text("Creating...")')).toBeVisible({ timeout: 2000 });
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Host New Game")');

    // Try to submit without name
    await page.click('button:has-text("Create Game")');

    // Should show validation error
    await expect(page.locator('text=/please enter your name/i')).toBeVisible();
  });

  test('should display game code prominently', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Host New Game")');
    await page.fill('input[type="text"]', 'Host');
    await page.click('button:has-text("Create Game")');

    await expect(page.locator('text=Game Code')).toBeVisible();

    // Game code should be prominently displayed with large text
    const gameCodeElement = page.getByTestId('game-code');
    await expect(gameCodeElement).toBeVisible();

    const fontSize = await gameCodeElement.evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    // Should be large text (at least 40px per design - text-5xl)
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(40);
  });

  test('should show player connection status', async ({ page, context }) => {
    await page.goto('/');
    await page.click('button:has-text("Host New Game")');
    await page.fill('input[type="text"]', 'Host');
    await page.click('button:has-text("Create Game")');

    await expect(page.locator('text=Game Code')).toBeVisible();
    const gameCodeElement = page.getByTestId('game-code');
    const gameCode = await gameCodeElement.textContent();

    // Join with second player
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.click('button:has-text("Join Game")');
    
    const inputs = page2.locator('input[type="text"]');
    await inputs.first().fill('Player2');
    await inputs.nth(1).fill(gameCode!);
    await page2.click('button:has-text("Join Game")');

    // Both players should show green connection indicator
    await expect(page.locator('text=Player2')).toBeVisible({ timeout: 10000 });
    
    // Check for connection indicators (green dots)
    const connectionDots = page.locator('.bg-green-500');
    await expect(connectionDots).toHaveCount(2); // Both players connected

    await page2.close();
  });
});
