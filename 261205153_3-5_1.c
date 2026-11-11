#include <stdio.h>

int main(void)
{
    int coin[10];
    int count[12];
    int n, total, k, j, m, run, maxrun, best;

    printf("n,連続した表の最大数がm回以上の確率が20%%以上となるmの最大値\n");
    for (n = 3; n <= 10; n++) {
        for (m = 0; m <= n + 1; m++) count[m] = 0;   /* n ごとに集計し直す */
        total = 1 << n;

        for (k = 0; k < total; k++) {
            for (j = 0; j < n; j++) {
                coin[j] = (k >> (n - 1 - j)) & 1;
            }
            run = 0;
            maxrun = 0;
            for (j = 0; j < n; j++) {
                run = coin[j] ? run + 1 : 0;
                if (run > maxrun) maxrun = run;
            }
            count[maxrun]++;
        }
        for (m = n - 1; m >= 0; m--) {               /* 「m 回以上」の数にする */
            count[m] += count[m + 1];
        }

        best = 0;
        for (m = 0; m <= n; m++) {
            if (count[m] * 100 >= total * 20) {      /* 確率 >= 20% を整数で比べる */
                best = m;
            }
        }
        printf("%d, %d\n", n, best);
    }
    return 0;
}
